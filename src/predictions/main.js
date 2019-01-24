console.clear();
import FareEstimateController from "../controllers/fare-estimate";
import FareEstimate from "../models/fare-estimate";
import LinearScaler from "../utils/linear-scaler";
import PredictionModel from "../models/prediction-model";
import NeuralNetwork from "./neural-network";

const bluebird = require("bluebird");
const moment = require("moment");
const synaptic = require("synaptic");
require("moment-range").extendMoment(moment);


var linearScaler = new LinearScaler([18, 30], [0, 1])

function testNetwork(network) {

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

            var result = network.activate(transformTimeToInputs(date))
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

//  [0,5] => Array(0,0,0,0,0)
function intToUnary(int, range) {
    var ret = Array((range[1] - range[0]) + 1).fill(0);
    ret[int] = 1;
    return ret;
}

function transformTimeToInputs(time) {
    var time = moment(time);
    var inputs = [].concat(
        intToUnary(time.month(), [0,11]),
        intToUnary(time.date(), [1,31]),
        intToUnary(time.day(), [0,6]),
        intToUnary(time.hour(), [0,23]),
        intToUnary(time.minute(), [0,59])
    );
    //console.log("inputs length", inputs.length);
    //console.log("inputs", inputs);
    return inputs;
}


function transformDataToTrainingSet(fareEstimate) {

    var inputs = transformTimeToInputs(fareEstimate.time);
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

    var neuralNetwork = new NeuralNetwork("test3");
    await neuralNetwork.loadModel();

    console.log("trainingSet", trainingSet);
    neuralNetwork.train(trainingSet, {
        log: 1,
        iterations: 1000,
        error: 0.001
    });


    //await neuralNetwork.saveModel()


    var range = moment.range(moment(), moment().add(3, "days"));
    range = Array.from(range.by("minutes"));
    console.log("range", range);

    var inputs = transformTimeToInputs(range[0]);
    console.log("inputs", inputs);
    var result = neuralNetwork.activate(inputs);
    console.log("result", result);
    var scaled = linearScaler.inverse(result);
    console.log("scaled", scaled);

    console.log("calculating predictions...");
    var predictions = range.map(time => {
        var value = neuralNetwork.activate(transformTimeToInputs(time));
        return {time, value};
    })
    //var predictions = range.map(date => {
    //    var result = neuralNetwork.activate()
    //    return {time: date, value: result};
    //})
    console.log("predictions", predictions);

    predictions = predictions.map(prediction => {
        return {
            type: "Pool",
            time: prediction.time,
            value: linearScaler.inverse(prediction.value),
            predicted: true
        }
    })
    //testNetwork();

    //var predictions = createPredictionData();
    await FareEstimate.destroy({where: {predicted: 1}});
    var count = await FareEstimate.count({where: {predicted: 1}})
    await fareEstimateController.insert(predictions);

    console.log(transformTimeToInputs);

    //console.log(myPerceptron.toJSON())

}).catch(function(error) {
    console.log("error", error);
});


setInterval(() => {}, 1000);


process.on("uncaughtException", error => {
    console.error(error);
    process.exit(1); // not optional
});
