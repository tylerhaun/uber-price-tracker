from dateutil import parser
import datetime
import sqlite3
import numpy as np 
import os 


connection = sqlite3.connect("database.sqlite");

#models = connection.execute("SELECT * FROM prediction_models LIMIT 1;").fetchall()
#print(models);

def int_to_unary(int, range):
    size = (range[1] - range[0]) + 1
    ret = [0] * size
    ret[int] = 1
    return ret

def transform_time_to_inputs(time):
    inputs = []
    inputs += int_to_unary(time.month, [1,12])
    inputs += int_to_unary(time.day, [1,31])
    inputs += int_to_unary(time.weekday(), [0,6])
    inputs += int_to_unary(time.hour, [0, 23])
    inputs += int_to_unary(time.minute, [0,59])
    print(inputs)
    return inputs

print(transform_time_to_inputs(datetime.datetime.now()))


def load_estimates():
    sql = "SELECT * FROM fare_estimates WHERE predicted IS NOT 1 AND deletedAt IS NULL LIMIT 5"
    print("executing sql {}".format(sql))
    estimates = connection.execute(sql).fetchall()
    print(estimates[0:3])
    return estimates
load_estimates()


model = None
def run_xor():
    from keras.models import Sequential
    from keras.layers.core import Dense, Dropout, Activation
    from keras.optimizers import SGD

    input_X = np.array([[0,0],[0,1],[1,0],[1,1]])
    output_y = np.array([[0],[1],[1],[0]])

    model = Sequential()
    model.add(Dense(8, input_dim=2))
    model.add(Activation('tanh'))
    model.add(Dense(1))
    model.add(Activation('sigmoid'))

    stochastic_gradient_descent = SGD(lr=0.1)
    print("compiling model...")
    model.compile(loss='binary_crossentropy', optimizer=stochastic_gradient_descent)

    print("fitting model...")
    model.fit(input_X, output_y, batch_size=1, epochs=100, verbose=0)
    print(model.predict_proba(input_X))
    return model

model = run_xor()


class PredictionModelController:

    table = "prediction_models"

    def __init__(self):
        pass
    def insert(self, model, name):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        timestamp = datetime.datetime.utcnow().isoformat()
        newest_version = self.find_newest_version(name)
        version = newest_version + 1
        save_dir_path = "";
        save_filename = "{name}_{version}_{timestamp}.h5".format(**{"name": name, "version": version, "timestamp": datetime.datetime.now().strftime("%F_%R")});
        file_path = dir_path + "/prediction-models/" + save_filename
        model.save(file_path)
        data={
            "name": name,
            "version": version,
            "file_path": file_path,
            "createdAt": timestamp,
            "updatedAt": timestamp
        }
        columns = "({})".format(",".join(data.keys()))
        values = "({})".format(",".join(list(map(str, data.values()))))
        sql = "INSERT INTO {table} {columns} VALUES {values}".format(**{"table": self.table, "columns": columns, "values": values})
        print("executing sql {}".format(sql))
        #result = connection.execute(sql)

    def find_by_name(self, name):
        sql = "SELECT id,version,file_path,createdAt FROM {table} WHERE name='{name}' AND deletedAt IS NULL".format(**{"table": self.table, "name": name})
        print("executing sql {}".format(sql))
        models = connection.execute(sql).fetchall()
        print("found models {}".format(models))

    def find_newest_version(self, name):
        print("find_newest_version")
        sql = "SELECT version FROM {table} WHERE name='{name}' AND deletedAt IS NULL".format(**{"table": self.table, "name": name})
        versions = connection.execute(sql).fetchall()
        print("versions {}".format(versions))
        if len(versions) is 0:
            return -1
        max_version = max(versions)
        print("max_Version {}".format(max_version))
        return max_version


prediction_model_controller = PredictionModelController()
prediction_model_controller.find_by_name("test4")

#prediction_model_controller.insert(model, "test6")

