from dateutil import parser

from fare_estimate_controller import FareEstimateController
from linear_scaler import LinearScaler
from transformations import int_to_unary, transform_time_to_inputs

import datetime
import json
import numpy as np 
import os 
import pandas
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




#def load_estimates(limit=100):
#    sql = "SELECT * FROM fare_estimates WHERE type='Pool' AND predicted IS NOT 1 AND deletedAt IS NULL LIMIT {limit}".format(limit=limit)
#    print("executing sql {}".format(sql))
#    estimates = connection.execute(sql).fetchall()
#    print(estimates[0:3])
#    return estimates
#
#def insert(table, data):
#    print("insert({},{},{})")
#    print("inserting data {}".format(json.dumps(data, indent=4, default=json_serial)))
#    for d in data:
#        sql = fare_estimates_table.insert().values(d)
#        print(sql)
#        engine.execute(sql)


scaler = LinearScaler([18,30], [0,1])
fare_estimates_controller = FareEstimateController(engine)

def now_utc_offset():
    return pytz.timezone("America/Los_Angeles").localize(datetime.datetime.now()).astimezone(pytz.utc)

def format_data_for_prediction(date_range, predictions):
    fare_estimates = []
    now = now_utc_offset()
    #now_tz = pytz.timezone("America/Los_Angeles").localize(now)
    for i in range(len(date_range)):
        ts = date_range[i]
        time = ts.to_pydatetime()
        #time = time.replace(tzinfo=pytz.timezone("America/Los_Angeles").localize(now).tzinfo)
        #time = pytz.timezone("America/Los_Angeles").localize(time)
        #time = time.strftime("%Y-%m-%d %H:%M:%S.%s %z")
        value = round(scaler.inverse(predictions[i][0]), 2)
        fare_estimate = {
            "type": "Pool",
            "value": value,
            "time": time,
            "predicted": 1,
            "createdAt": now,
            "updatedAt": now
        }
        #fare_estimate = ("Pool", scaler.inverse(predictions[i][0]), time, 1, now_tz, now_tz)
        #for i in range(len(columns)):
        #    fare_estimates[i].append(fare_estimate[i])
        fare_estimates.append(fare_estimate)
    return fare_estimates

def create_prediction_data(model):
    print("create_prediction_data()")
    now = now_utc_offset()
    date_range = pandas.date_range(now, now + datetime.timedelta(days=5), freq="1min")
    print("date_range {}".format(date_range))
    print("date_range {}".format(len(date_range)))
    inputs = []
    for date in date_range:
        inputs.append(transform_time_to_inputs(date))
    inputs = np.array(inputs)
    print("inputs {}".format(inputs))
    predictions = model.predict(inputs)
    print("predictions {}".format(predictions))
    fare_estimates = format_data_for_prediction(date_range, predictions)

    for i in range(10):
        print("{}: {}".format(date_range[i * 100].strftime("%c %p"), scaler.inverse(predictions[i * 100][0])))

    fare_estimates_controller.insert(fare_estimates)



def train_model():
    from keras.models import Sequential
    from keras.layers.core import Dense, Dropout, Activation
    from keras.optimizers import SGD


    print("loading estimates...")
    #estimates = load_estimates(limit=10)
    estimates = fare_estimates_controller.find("WHERE type='Pool' AND predicted IS NOT 1 and deletedAt IS NULL", {"limit": 30000})
    print("fetched {} estimates".format(len(estimates)))
    print(estimates[0])
    def map_estimates_to_input(estimate):
        time = estimate[3]
        time = parser.parse(time)
        #inputs = transform_time_to_inputs(parser.parse(time))
        inputs = transform_time_to_inputs(time)
        return inputs
    inputs = np.array(list(map(map_estimates_to_input, estimates)))
    def map_estimates_to_output(estimate):
        scaled = scaler.scale(estimate[2])
        return scaled
    outputs = np.array(list(map(map_estimates_to_output, estimates)))

    num_inputs = 134
    model = Sequential()
    model.add(Dense(num_inputs * 2, input_dim=num_inputs, activation="tanh"))
    #model.add(Activation('tanh'))
    model.add(Dense(1, activation="sigmoid"))
    #model.add(Activation('sigmoid'))

    for i in range(10):
        print("{}: {}".format(inputs[i], outputs[i]))

    stochastic_gradient_descent = SGD(lr=0.1)
    print("compiling model...")
    model.compile(loss='binary_crossentropy', optimizer=stochastic_gradient_descent)

    print("fitting model...")
    model.fit(inputs, outputs, batch_size=10, epochs=25, verbose=1)
    #print(model.predict_proba(inputs))
    create_prediction_data(model)
    return model

model = train_model()

