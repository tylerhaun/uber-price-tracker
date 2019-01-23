const synaptic = require("synaptic");

class Perceptron extends synaptic.Network {
    constructor(input, hidden, output) {
        super(...arguments);

        var inputLayer = new synaptic.Layer(input);
        var hiddenLayer1 = new synaptic.Layer(hidden);
        var hiddenLayer2 = new synaptic.Layer(hidden);
        var outputLayer = new synaptic.Layer(output);

        inputLayer.project(hiddenLayer1);
        hiddenLayer1.project(hiddenLayer2);
        hiddenLayer2.project(outputLayer);

        //this.input = inputLayer;
        //this.hidden = [hiddenLayer, hiddenLayer2];
        //this.output = outputLayer;

        this.set({
            input: inputLayer,
            hidden: [hiddenLayer2, hiddenLayer2],
            output: outputLayer
        });

    }

}
export default Perceptron;
