import FareEstimateController from "./controllers/fare-estimate";

const handlebars = require("handlebars");
const fs = require("fs");
const moment = require("moment");

module.exports = function(request, response, next) {

    const fareEstimateController = new FareEstimateController()
    fareEstimateController.find(request.query)
        .then(function(fareEstimates) {
            //console.log("fareEstimates", fareEstimates);
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

