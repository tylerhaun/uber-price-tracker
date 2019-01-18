import FareEstimateController from "./controllers/fare-estimate";

const cron = require("node-cron");
const express = require("express");
const moment = require("moment");
const rp = require("request-promise");

const app = express();
var port = 8081;
app.listen(port, function() {
    console.log("app listening on port " + port);
})

const router = express.Router();

router.route("/fare-estimates")
    .get(function(request, response, next) {
        const fareEstimateController = new FareEstimateController()
        fareEstimateController.find(request.query)
            .then(function(fareEstimates) {
                console.log("fareEstimates", fareEstimates);
                return response.json(fareEstimates)
            })
            .catch(next)
    });

app.use("/api/v0", router)
app.use("/line-chart", require("./line-chart-route"))
app.use(function(request, response, next) {
    const error = new Error("Not Found");
    error.status = 404;
    return next(error);
})
app.use(function(error, request, response, next) {
    console.error(error);
    return response.status(error.status || 500).json({name: error.name, message: error.message})
})


class UberFareEstimateAPIController {

    fetch() {

        const requestOptions = {
            method: "GET",
            uri: "https://www.uber.com/api/fare-estimate-beta?pickupRef=ChIJGQCRws6kwoARq_Uj_7UKF7Q&pickupRefType=google_places&pickupLat=34.0194543&pickupLng=-118.4911912&destinationRef=ChIJv3lSBAe_woAR5Pq9l2eaevY&destinationRefType=google_places",
            json: true
        };
        return rp(requestOptions)
            //.then(function(response) {
            //    console.log("response", response);
            //})
    
    }

}


class PriceTracker {

    async fetchAndSave() {
        console.log("fetchAndSave()");
        const uberFareEstimateAPIController = new UberFareEstimateAPIController();
        const data = await uberFareEstimateAPIController.fetch()
        //console.log("got data", data);

        const fareEstimateController = new FareEstimateController();
        //const testData = {
        //    type: "test",
        //    value: Math.round(Math.random() * 100),
        //    time: moment()
        //};
        const fareData = data.prices.map(function(d) {
            return {
                type: d["vehicleViewDisplayName"],
                value: d["total"],
                time: moment()
            }
        })
        fareEstimateController.insert(fareData);

        

    }

}

const priceTracker = new PriceTracker();

priceTracker.fetchAndSave()
cron.schedule('* * * * *', () => {
    console.log("running price tracker...")
    priceTracker.fetchAndSave()
});



process.on("uncaughtException", error => {
    console.error(error);
    process.exit(1); // not optional
});
