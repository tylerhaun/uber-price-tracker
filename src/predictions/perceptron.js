const synaptic = require("synaptic");

function createNLayers(numLayers, layerSize) {
    var layers = [];
    for (var i=0;i<numLayers;i++) {
        var layer = new synaptic.Layer(layerSize);
        if (layers[i-1]) {
            layers[i-1].project(layer);
        }
        layers.push(layer);
    }
    return layers;
}

class Perceptron extends synaptic.Network {
    constructor(input, hidden, output) {
        super(...arguments);

        var inputLayer = new synaptic.Layer(input);
        var hiddenLayers = createNLayers(1, hidden);
        var outputLayer = new synaptic.Layer(output);

        inputLayer.project(hiddenLayers[0]);
        hiddenLayers[hiddenLayers.length - 1].project(outputLayer);

        this.set({
            input: inputLayer,
            hidden: hiddenLayers,
            output: outputLayer
        });

    }

}
export default Perceptron;
