import FareEstimateController from "./controllers/fare-estimate";

const rp = require("request-promise");
const moment = require("moment");
const cron = require("node-cron");
const express = require("express");

const app = express();

const router = express.Router();

router.route("/fare-estimates")
    .get(function(request, response, next) {
        const fareEstimateController = new FareEstimateController()
    });

app.use("/api/v0", router)


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
