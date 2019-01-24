import Perceptron from "./perceptron";
import PredictionModel from "../models/prediction-model";

const synaptic = require("synaptic");
const moment = require("moment");
require("moment-range").extendMoment(moment);


// gives save and load functions for database
// TODO gotta think of a better name
class NeuralNetwork {

    constructor(modelName) {

        if (!modelName) throw new Error("Must pass a name");
        this._modelName = modelName;

    }

    async saveModel() {
        console.log("saveModel()");
        var modelJson = JSON.stringify(this.network.toJSON());
        var modelData = {
            name: this._modelName,
            model_json: modelJson
        };
        return PredictionModel.create(modelData);
    }

    setModel(network) {
        console.log("setModel()", network);

        this.network = network;

        this.trainer = new synaptic.Trainer(network);

        return network;
        
    }

    async loadModel() {
        console.log("loadModel()");
        return PredictionModel.findAll({name: this._modelName})
            .then(predictionModels => {
                var predictionModel = predictionModels[predictionModels.length - 1];
                console.log("predictionModel", predictionModel);
                if (!predictionModel) {
                    console.log("No prediction model found.");
                    console.log("Creating new model...");
                    var model = new Perceptron(134, 200, 1);
                    return this.setModel(model);
                }

                return this.setModel(synaptic.Network.fromJSON(JSON.parse(predictionModel.model_json)));
            })
    }

    train(trainingSet, options) {
        console.log("train()");

        console.log("training network...")
        console.time()
        var training = this.trainer.train(trainingSet, options);
        console.timeEnd();
        console.log("training", training);
        
    }

    predictDateRange(startDate, endDate, stepUnits) {
        console.log("predictDateRange()");

        var range = moment.range(startDate, endDate);
        range = Array.from(range.by(stepUnits));
        console.log("range", range);


        var predictions = range.map(time => {
            var value = this.network.activate(this.timeToInputs(time));
            return {time, value};
        })

        console.log("predictions", predictions);

        return predictions;
        
    }

    activate(input) {

        return this.network.activate(input);
    
    }

    //scaleValue(value) {
    //    var xMin = 0;
    //    var xMax = 1;
    //    var yMin = 18;
    //    var yMax = 30;
    //    var percent = (value - yMin) / (yMax - yMin);
    //    var outputX = percent * (xMax - xMin) + xMin;
    //    return outputX;
    //}

    //scaleValueInverse(value) {
    //    var xMin = 18;
    //    var xMax = 30;
    //    var yMin = 0;
    //    var yMax = 1;
    //    var percent = (value - yMin) / (yMax - yMin);
    //    var outputX = percent * (xMax - xMin) + xMin;
    //    return outputX;
    //}

    //transformTimeToInputs(time) {
    //    var time = moment(time);
    //    var inputs = [
    //        time.month() / 12,
    //        time.date() / 31,
    //        time.day() / 7,
    //        time.hour() / 24,
    //        time.minute() / 60
    //    ];

    //    return inputs;
    //}

    //transformValue(value) {
    //    return linearScaler.scale(value)
    //}

    //transformValueInverse(value) {
    //    return linearScaler.scaleInverse(value)
    //}

    //transformDataToTrainingSet(fareEstimate) {

    //    var inputs = timeToInputs(fareEstimate.time);
    //    var output = scaleValue(fareEstimate.value);

    //    return {
    //        input: inputs,
    //        output: [output]
    //    };

    //}

}

export default NeuralNetwork;
