

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

