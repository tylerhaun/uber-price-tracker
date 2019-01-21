import FareEstimateController from "./controllers/fare-estimate";

const bluebird = require("bluebird");
const handlebars = require("handlebars");
const fs = require("fs");
const moment = require("moment");
const sqlite3 = require('sqlite3').verbose();
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
});

function constructQuery(request, count) {

    const sql = sequelize.dialect.QueryGenerator.selectQuery("fare_estimates", {where: request.query || {}});
    var innerWhere = new RegExp(/^.*(WHERE.*);$/).exec(sql)[1];

    var numPointsTarget = 512;
    //request.query.downsampleFactor = request.query.downsampleFactor || 1;
    var downsampleFactor = Math.floor(count / numPointsTarget);
    downsampleFactor = downsampleFactor || 1;

    //var innerWhere = "WHERE type='" + request.query.type + "'"
    var innerStatement = "SELECT ROW_NUMBER () OVER (ORDER BY time) row_num, * FROM fare_estimates " + innerWhere;
    var outerWhere = " WHERE row_num % " + downsampleFactor + " = 0;"
    var fullStatement = "SELECT * FROM (" + innerStatement + ") " + outerWhere;

    return fullStatement;

}


module.exports = function(request, response, next) {
    if (Object.keys(request.query).length == 0) {
        var redirectQuery = "type=Pool&time[$gt]=" + moment().subtract(3, "days").format("YYYY-MM-DD");
        return response.redirect("/line-chart?" + redirectQuery);
    }

    const fareEstimateController = new FareEstimateController()
    bluebird.resolve()
        .then(async function() {

            const count = await fareEstimateController.count(request.query)

            //var fareEstimates = await fareEstimateController.find(request.query)

            const fullStatement = constructQuery(request, count);
            var fareEstimates = await sequelize.query(fullStatement, {
                    //model: FareEstimateController.model,
                    //mapToModel: true // pass true here if you have any mapped fields
                })
            fareEstimates = fareEstimates[0];

            fareEstimates = fareEstimates.map(function(estimate) {
                return {
                    date: estimate.time,
                    value: estimate.value
                };
            })


            var filePath = __dirname + "/views/line_chart.hbs";
            const fileData = fs.readFileSync(filePath, "utf-8");
            var fareEstimatesJson = JSON.stringify(fareEstimates);

            var templateData = {
                data: fareEstimatesJson,
                lastUpdateTime: fareEstimates[fareEstimates.length - 1].date
            };

            var html = handlebars.compile(fileData)(templateData);
            return response.send(html);
        })
        .catch(next)
}

