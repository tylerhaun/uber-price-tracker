

class LinearScaler:
    def __init__(self, inputRange, outputRange):
        self._inputRange = inputRange
        self._outputRange = outputRange

    def scale(self, value):
        xMin = self._outputRange[0];
        xMax = self._outputRange[1];
        yMin = self._inputRange[0];
        yMax = self._inputRange[1];
        percent = (value - yMin) / (yMax - yMin);
        outputX = percent * (xMax - xMin) + xMin;
        return outputX;

    def inverse(self, value):
        xMin = self._inputRange[0];
        xMax = self._inputRange[1];
        yMin = self._outputRange[0];
        yMax = self._outputRange[1];
        percent = (value - yMin) / (yMax - yMin);
        outputX = percent * (xMax - xMin) + xMin;
        return outputX;
