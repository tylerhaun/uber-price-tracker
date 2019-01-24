
class LinearScaler {

    constructor(inputRange, outputRange) {
        this._inputRange = inputRange;
        this._outputRange = outputRange;
    }

    scale(value) {
        var xMin = this._outputRange[0];
        var xMax = this._outputRange[1];
        var yMin = this._inputRange[0];
        var yMax = this._inputRange[1];
        var percent = (value - yMin) / (yMax - yMin);
        var outputX = percent * (xMax - xMin) + xMin;
        return outputX;
    }

    inverse(value) {
        var xMin = this._inputRange[0];
        var xMax = this._inputRange[1];
        var yMin = this._outputRange[0];
        var yMax = this._outputRange[1];
        var percent = (value - yMin) / (yMax - yMin);
        var outputX = percent * (xMax - xMin) + xMin;
        return outputX;
    }

}

export default LinearScaler;
