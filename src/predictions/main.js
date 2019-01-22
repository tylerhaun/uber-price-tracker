console.clear();
import FareEstimateController from "../controllers/fare-estimate";
//import PredictionController from "../controllers/prediction";

const bluebird = require("bluebird");
const moment = require("moment");
const synaptic = require("synaptic");
require("moment-range").extendMoment(moment);

var myPerceptron = new synaptic.Architect.Perceptron(5,20,1);
console.log("myPerceptron", myPerceptron);
var myTrainer = new synaptic.Trainer(myPerceptron);
console.log("myTrainer", myTrainer);


//var trainingData = require("./trainingData");
//var trainingSet = trainingData.map(function(data) {
//
//    var inputs = timeToInputs(data.time);
//
//    var xMin = 0;
//    var xMax = 1;
//
//    var yMin = 10;
//    var yMax = 30;
//
//    var percent = (data.value - yMin) / (yMax - yMin);
//    var outputX = percent * (xMax - xMin) + xMin;
//
//    return {
//        input: inputs,
//        output: [outputX]
//    };
//})
//console.log("trainingSet", trainingSet);

//var trainingSet = [
//    {
//        input: [0,0],
//        output: [0]
//    },
//    {
//        input: [0,1],
//        output: [1]
//    },
//    {
//        input: [1,0],
//        output: [1]
//    },
//    {
//        input: [1,1],
//        output: [0]
//    },
//];





//var result;
//result = myPerceptron.activate(moment("2019-02-05"));
//console.log("result", result);
//result = myPerceptron.activate([1,0]);
//console.log("result", result);
//result = myPerceptron.activate([0,1]);
//console.log("result", result);
//result = myPerceptron.activate([1,1]);
//console.log("result", result);

//console.log(myPerceptron.standalone());
//console.log(myPerceptron.toJSON());


function scaleValue(value) {
    var xMin = 0;
    var xMax = 1;
    var yMin = 18;
    var yMax = 30;
    var percent = (value - yMin) / (yMax - yMin);
    var outputX = percent * (xMax - xMin) + xMin;
    return outputX;
}
function scaleValueInverse(value) {
    var xMin = 18;
    var xMax = 30;
    var yMin = 0;
    var yMax = 1;
    var percent = (value - yMin) / (yMax - yMin);
    var outputX = percent * (xMax - xMin) + xMin;
    return outputX;
}


function timeToInputs(time) {

    var time = moment(time);

    var inputs = [
        time.month() / 12,
        time.date() / 31,
        time.day() / 7,
        time.hour() / 24,
        time.minute() / 60
    ];

    return inputs;

}

function transformDataToTrainingSet(fareEstimate) {

    var inputs = timeToInputs(fareEstimate.time);
    var output = scaleValue(fareEstimate.value);


    return {
        input: inputs,
        output: [output]
    };

}

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

function createPredictionData() {

    var range = moment.range(moment(), moment().add(3, "days"));
    range = Array.from(range.by("minutes"));
    console.log("range", range);


    var predictions = range.map(time => {
        var value = scaleValueInverse(myPerceptron.activate(timeToInputs(time)))
        return {
            type: "Pool",
            time,
            value,
            predicted: true
        }
    })

    console.log("predictions", predictions);

    return predictions;

}

bluebird.resolve().then(async function() {

    const fareEstimateController = new FareEstimateController();
    const fareEstimates = await fareEstimateController.find({type: "Pool"}, {limit: 2000, offset: 4000})
    console.log("fareEstimates", fareEstimates);

    var trainingSet = fareEstimates.map(transformDataToTrainingSet)

    console.log("trainingSet", trainingSet);

    console.log("training network...")
    console.time()
    var training = myTrainer.train(trainingSet, {
        log: 1000,
        iterations: 20000,
        error: 0.001
    });
    console.timeEnd();
    console.log("training", training);

    testNetwork();

    var predictions = createPredictionData();
    fareEstimateController.insert(predictions);

    console.log(myPerceptron.toJSON())

}).catch(console.error);


setInterval(() => {}, 1000);
