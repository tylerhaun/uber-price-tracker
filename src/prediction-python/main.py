from dateutil import parser
import datetime
import pandas
import sqlalchemy
import sqlite3
import numpy as np 
import os 

db_path = "database.sqlite"
connection = sqlite3.connect(db_path)
engine = sqlalchemy.create_engine("sqlite:///{}".format(db_path))
print(engine)

df = pandas.read_sql("SELECT * FROM fare_estimates LIMIT 100", engine)
print(df)

#models = connection.execute("SELECT * FROM prediction_models LIMIT 1;").fetchall()
#print(models);

def int_to_unary(int, range):
    size = (range[1] - range[0]) + 1
    ret = [0] * size
    ret[int] = 1
    return ret

def transform_time_to_inputs(time):
    #print("transform_time_to_inputs()")
    inputs = np.concatenate([
        int_to_unary(time.month, [1,12]),
        int_to_unary(time.day, [1,31]),
        int_to_unary(time.weekday(), [0,6]),
        int_to_unary(time.hour, [0, 23]),
        int_to_unary(time.minute, [0,59]),
    ])
    return inputs

print(len(transform_time_to_inputs(datetime.datetime.now())))


def load_estimates(limit=100):
    sql = "SELECT * FROM fare_estimates WHERE type='Pool' AND predicted IS NOT 1 AND deletedAt IS NULL LIMIT {limit}".format(limit=limit)
    print("executing sql {}".format(sql))
    estimates = connection.execute(sql).fetchall()
    print(estimates[0:3])
    return estimates

def insert(table, columns, data):
    columns_sql = "({})".format(",".join(columns))
    #values_sql = "({})".format(",".join(list(map(str, data.values()))))
    values_sql = "({))".format(",".join("?"))
    sql = "INSERT INTO {table} {columns} VALUES {values}".format(**{"table": self.table, "columns": columnsi_sql, "values": values_sql})
    print("executing sql {}".format(sql))
    #connection.execute(sql, data)


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

scaler = LinearScaler([18,30], [0,1])

def create_prediction_data(model):
    print("create_prediction_data()")
    now = datetime.datetime.now()
    date_range = pandas.date_range(now, now + datetime.timedelta(days=5), freq="5min")
    print("date_range {}".format(date_range))
    inputs = []
    for date in date_range:
        inputs.append(transform_time_to_inputs(date))
    inputs = np.array(inputs)
    print("inputs {}".format(inputs))
    predictions = model.predict(inputs)
    print("predictions {}".format(predictions))
    def map_predictions(prediction):
        ret = {
            "type": "Pool"
            "value"
                
        }

    fare_estimates = []
    now = datetime.datetime.now()
    for i in range(len(date_range)):
        ts = date_range[i]
        time = ts.to_pydatetime()
        time = time.update(tzinfo=pytz.timezone("America/Los_Angeles").localize(now))
        fare_estimate = {
            "type": "Pool",
            "value": scaler.inverse(predictions[i][0],
            "time": time,
            "predicted": True
        }

    for i in range(10):
        print("{}: {}".format(date_range[i * 100].strftime("%c %p"), scaler.inverse(predictions[i * 100][0])))
    insert([], predictions


def train_model():
    from keras.models import Sequential
    from keras.layers.core import Dense, Dropout, Activation
    from keras.optimizers import SGD


    print("loading estimates...")
    estimates = load_estimates(limit=2000)
    print("fetched {} estimates".format(len(estimates)))
    def map_estimates_to_input(estimate):
        time = estimate[3]
        inputs = transform_time_to_inputs(parser.parse(time))
        return inputs
    inputs = np.array(list(map(map_estimates_to_input, estimates)))
    def map_estimates_to_output(estimate):
        scaled = scaler.scale(estimate[2])
        return scaled
    outputs = np.array(list(map(map_estimates_to_output, estimates)))
        
    model = Sequential()
    model.add(Dense(8, input_dim=134))
    model.add(Activation('tanh'))
    model.add(Dense(1))
    model.add(Activation('sigmoid'))

    for i in range(10):
        print("{}: {}".format(inputs[i], outputs[i]))

    stochastic_gradient_descent = SGD(lr=0.1)
    print("compiling model...")
    model.compile(loss='binary_crossentropy', optimizer=stochastic_gradient_descent)

    print("fitting model...")
    model.fit(inputs, outputs, batch_size=10, epochs=20, verbose=1)
    #print(model.predict_proba(inputs))
    create_prediction_data(model)
    return model

model = train_model()


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

