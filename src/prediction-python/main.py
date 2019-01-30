from dateutil import parser

from fare_estimate_controller import FareEstimateController
from linear_scaler import LinearScaler
from transformations import int_to_unary, transform_time_to_inputs

import datetime
import json
import numpy as np 
import os 
import pandas
import peewee
import pytz
import re
import sqlalchemy
import sqlite3


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))

db_path = "database.sqlite"
connection = sqlite3.connect(db_path)
engine = sqlalchemy.create_engine("sqlite:///{}".format(db_path))
print(engine)

#df = pandas.read_sql("SELECT * FROM fare_estimates LIMIT 100", engine)
#print(df)



count = engine.execute("SELECT COUNT(*) FROM fare_estimates;").fetchall()
print(count);

count = engine.execute("SELECT COUNT(*) FROM fare_estimates WHERE predicted=1;").fetchall()
print(count)
engine.execute("DELETE FROM fare_estimates WHERE predicted=1;")
count = engine.execute("SELECT COUNT(*) FROM fare_estimates WHERE predicted=1;").fetchall()
print(count)




def load_estimates(limit=100):
    sql = "SELECT * FROM fare_estimates WHERE type='Pool' AND predicted IS NOT 1 AND deletedAt IS NULL LIMIT {limit}".format(limit=limit)
    print("executing sql {}".format(sql))
    estimates = connection.execute(sql).fetchall()
    print(estimates[0:3])
    return estimates

def insert(table, data):
    print("insert({},{},{})")
    #columns = data[0].keys()
    #columns_sql = "({})".format(",".join(columns))
    ##values_sql = "({})".format(",".join(list(map(str, data.values()))))
    #values_sql = "({})".format(",".join(["?"] * len(columns)))
    print("inserting data {}".format(json.dumps(data, indent=4, default=json_serial)))
    for d in data:
        sql = fare_estimates_table.insert().values(d)
        print(sql)
        engine.execute(sql)
    #sql = "INSERT INTO {table} {columns} VALUES {values}".format(**{"table": table, "columns": columns_sql, "values": values_sql})
    #data_for_sql = []
    #for d in data:
    #    row = []
    #    for column in columns:
    #        row.append(d[column])
    #    data_for_sql.append(row)
    #print("executing sql {}".format(sql))
    #print(len(data))
    #try:
    #    cur = connection.executemany(sql, data_for_sql)
    #    print(dir(cur))
    #    #result = cur.fetchall()
    #    #print(result)
    #    print(cur.lastrowid)
    #    return cur.lastrowid
    #except:
    #    print("some error has occured")


scaler = LinearScaler([18,30], [0,1])
fare_estimates_controller = FareEstimateController(engine)


def merge_data_for_prediction(date_range, predictions):
    pass

def create_prediction_data(model):
    print("create_prediction_data()")
    now = datetime.datetime.now()
    date_range = pandas.date_range(now, now + datetime.timedelta(days=5), freq="5min")
    print("date_range {}".format(len(date_range)))
    inputs = []
    for date in date_range:
        inputs.append(transform_time_to_inputs(date))
    inputs = np.array(inputs)
    print("inputs {}".format(inputs))
    predictions = model.predict(inputs)
    print("predictions {}".format(predictions))
    #def map_predictions(prediction):
    #    ret = {
    #        "type": "Pool",
    #        "value": 1
    #    }

    #columns = ["type", "value", "time", "predicted", "createdAt", "updatedAt"]
    #fare_estimates = [[]] * len(columns)
    fare_estimates = []
    print("fare_estimates {}".format(fare_estimates))
    now = datetime.datetime.now()
    now_tz = pytz.timezone("America/Los_Angeles").localize(now)
    for i in range(len(date_range)):
        ts = date_range[i]
        time = ts.to_pydatetime()
        #time = time.replace(tzinfo=pytz.timezone("America/Los_Angeles").localize(now).tzinfo)
        time = pytz.timezone("America/Los_Angeles").localize(time)
        fare_estimate = {
            "type": "Pool",
            "value": scaler.inverse(predictions[i][0]),
            "time": time,
            "predicted": 1,
            "createdAt": now_tz,
            "updatedAt": now_tz
        }
        #fare_estimate = ("Pool", scaler.inverse(predictions[i][0]), time, 1, now_tz, now_tz)
        #for i in range(len(columns)):
        #    fare_estimates[i].append(fare_estimate[i])
        fare_estimates.append(fare_estimate)
    print(np.array(fare_estimates))
    print(np.array(fare_estimates[0]))
    print(np.array(fare_estimates[1]))

    for i in range(10):
        print("{}: {}".format(date_range[i * 100].strftime("%c %p"), scaler.inverse(predictions[i * 100][0])))
    #insert("fare_estimates", columns, fare_estimates)
    #insert("fare_estimates", fare_estimates)
    fare_estimates_controller.insert(fare_estimates)



def train_model():
    from keras.models import Sequential
    from keras.layers.core import Dense, Dropout, Activation
    from keras.optimizers import SGD


    print("loading estimates...")
    #estimates = load_estimates(limit=10)
    estimates = fare_estimates_controller.find("WHERE type='Pool' AND predicted IS NOT 1 and deletedAt IS NULL", {"limit": 1000})
    print("fetched {} estimates".format(len(estimates)))
    def map_estimates_to_input(estimate):
        time = estimate[3]
        #inputs = transform_time_to_inputs(parser.parse(time))
        inputs = transform_time_to_inputs(time)
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
    model.fit(inputs, outputs, batch_size=10, epochs=100, verbose=1)
    #print(model.predict_proba(inputs))
    create_prediction_data(model)
    return model

model = train_model()

