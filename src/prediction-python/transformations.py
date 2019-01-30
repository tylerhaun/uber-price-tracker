import numpy as np

def int_to_unary(int, range):
    #print("int_to_unary({}, {})".format(int, range))
    size = (range[1] - range[0]) + 1
    ret = [0] * size
    ret[int - range[0]] = 1
    return ret

def transform_time_to_inputs(time):
    #print("transform_time_to_inputs({})".format(time))
    inputs = np.concatenate([
        int_to_unary(time.month, [1,12]),
        int_to_unary(time.day, [1,31]),
        int_to_unary(time.weekday(), [0,6]),
        int_to_unary(time.hour, [0, 23]),
        int_to_unary(time.minute, [0,59]),
    ])
    return inputs
