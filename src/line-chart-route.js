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

    var numPointsTarget = 512;
    //request.query.downsampleFactor = request.query.downsampleFactor || 1;
    var downsampleFactor = Math.floor(count / numPointsTarget);
    console.log("downsampleFactor", downsampleFactor);
    downsampleFactor = downsampleFactor || 1;
    //console.log("where", Sequelize.model.where(request.query));

    var innerWhere = "WHERE type='" + request.query.type + "'"
    var innerStatement = "SELECT ROW_NUMBER () OVER (ORDER BY time) row_num, * FROM fare_estimates " + innerWhere;
    var outerWhere = " WHERE row_num % " + downsampleFactor + " = 0;"
    var fullStatement = "SELECT * FROM (" + innerStatement + ") " + outerWhere;

    return fullStatement;

}


module.exports = function(request, response, next) {
    var query = request.query;

    const fareEstimateController = new FareEstimateController()
    bluebird.resolve()
        .then(async function() {

            const count = await fareEstimateController.count(request.query)
            console.log("count", count);

            //var fareEstimates = await fareEstimateController.find(request.query)
            //console.log("fareEstimates", fareEstimates);

            const fullStatement = constructQuery(request, count);
            var fareEstimates = await sequelize.query(fullStatement, {
                    //model: FareEstimateController.model,
                    //mapToModel: true // pass true here if you have any mapped fields
                })
            fareEstimates = fareEstimates[0];
            console.log("FareEstimates", fareEstimates.length);

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
            console.log("templateData", templateData);

            var html = handlebars.compile(fileData)(templateData);
            return response.send(html);
        })
        .catch(next)
}

