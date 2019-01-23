import Perceptron from "./Perceptron";

const synaptic = require("synaptic");


// gives save and load functions for database
// TODO gotta think of a better name
class NeuralNetwork {

    constructor(modelName) {

        if (!modelName) throw new Error("Must pass a name");
        this._modelName = modelName;

    }

    async saveModel() {
        var modelJson = JSON.parse(this.network.toJSON());
        var modelData = {
            name: this._modelName,
            model_json: modelJson
        };
        return PredictionModel.create(modelData);
    }

    setModel(modelJson) {

        var predictionModelObject = JSON.parse(predictionModel);
        console.log("predictionModelObject", predictionModelObject);

        var network = synaptic.Network.fromJSON(predictionModelObject);
        console.log("network", network);
        this.network = network;

        this.trainer = new synaptic.Trainer(network);

        return network;
        
    }

    async loadModel() {
        return PredictionModel.findOne({name: this._modelName})
            .then(predictionModel => {
                console.log("predictionModel", predictionModel);
                if (!predictionModel) {
                    var model = new Perceptron(5, 20, 1);
                    return this.setModel(model);
                }

                return this.setModel(predictionModel.modelJson);
            })
    }

    train(timeSeriesData) {

        var trainingSet = fareEstimates.map(this.transformDataToTrainingSet)

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
        
    }

    predictDateRange(startDate, endDate, stepUnits) {

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
