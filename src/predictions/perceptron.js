const synaptic = require("synaptic");

class Perceptron extends synaptic.Network {
    constructor(input, hidden, output) {
        super(...arguments);

        var inputLayer = new synaptic.Layer(input);
        var hiddenLayer = new synaptic.Layer(hidden);
        var outputLayer = new synaptic.Layer(output);

        inputLayer.project(hiddenLayer);
        hiddenLayer.project(outputLayer);

        this.input = inputLayer;
        this.hidden = [hiddenLayer];
        this.output = outputLayer;

        this.set({
            input: inputLayer,
            hidden: [hiddenLayer],
            output: outputLayer
        });

    }

}
export default Perceptron;
