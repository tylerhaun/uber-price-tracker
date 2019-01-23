console.clear();
import FareEstimateController from "../controllers/fare-estimate";
import LinearScaler from "./utils/linear-scaler";
import PredictionModel from "../models/prediction-model";
import TimeSeriesNeuralNetwork from "../time-series-neural-network";

const bluebird = require("bluebird");
const moment = require("moment");
const synaptic = require("synaptic");
require("moment-range").extendMoment(moment);


var linearScaler = new LinearScaler([18, 20], [0, 1])

function testNetwork() {

    function randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    console.log("testing network")
    var dateRange = [moment("2019-01-20"), moment("2019-01-21")];
    var tests = Array(20).fill(null)
        .map((n, i) => {
            return moment(randomDate(...dateRange.map(date => date.toDate())));
        })
        .map(date => {

            var result = myPerceptron.activate(timeToInputs(date))
            return {input: date, output: result}
            //console.log(date.format("LLLL") + " : " + result);
    })
    console.log(tests);
    tests.forEach(test => {
        console.log(test.input.format("LLLL"), ":", test.output, scaleValueInverse(test.output));
    })

}

//function createPredictionData() {
//
//    var range = moment.range(moment(), moment().add(3, "days"));
//    range = Array.from(range.by("minutes"));
//    console.log("range", range);
//
//
//    var predictions = range.map(time => {
//        var value = scaleValueInverse(myPerceptron.activate(timeToInputs(time)))
//        return {
//            type: "Pool",
//            time,
//            value,
//            predicted: true
//        }
//    })
//
//    console.log("predictions", predictions);
//
//    return predictions;
//
//}


transformTimeToInputs(time) {
    var time = moment(time);
    var inputs = [
        time.month() / 12,
        time.date() / 31,
        time.day() / 7,
        time.hour() / 24,
        time.minute() / 60
    ];
}


transformDataToTrainingSet(fareEstimate) {

    var inputs = timeToInputs(fareEstimate.time);
    var output = linearScaler.scale(fareEstimate.value);

    return {
        input: inputs,
        output: [output]
    };

}


bluebird.resolve().then(async function() {

    const fareEstimateController = new FareEstimateController();
    const fareEstimates = await fareEstimateController.find({type: "Pool"}, {limit: 2000, offset: 4000})
    console.log("fareEstimates", fareEstimates);

    var trainingSet = fareEstimates.map(transformDataToTrainingSet)

    //console.log("trainingSet", trainingSet);

    //console.log("training network...")
    //console.time()
    //var training = myTrainer.train(trainingSet, {
    //    log: 1000,
    //    iterations: 20000,
    //    error: 0.001
    //});
    //console.timeEnd();
    //console.log("training", training);

    var timeSeriesNeuralNetwork = new TimeSeriesNeuralNetwork("test");
    await timeSeriesNeuralNetwork.loadModel();

    timeSeriesNeuralNetwork.train(trainingSet, {
        log: 1000,
        iterations: 20000,
        error: 0.001
    });


    var predictions = timeSeriesNeuralNetwork.predictDateRange(moment(), moment().add(3, "days"))

    predictions = predictions.map(prediction => {
        return {
            type: "Pool",
            prediction.time,
            linearScaler.inverse(prediction.value),
            predicted: true
        }
    })
    //testNetwork();

    //var predictions = createPredictionData();
    fareEstimateController.insert(predictions);

    console.log(myPerceptron.toJSON())

}).catch(console.error);


setInterval(() => {}, 1000);
