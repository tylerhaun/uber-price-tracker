from progress_logger import ProgressLogger

import sqlalchemy
import re

class FareEstimateController:
    def __init__(self, engine):
        self.engine = engine
        metadata = sqlalchemy.MetaData()
        self.table = sqlalchemy.Table("fare_estimates", metadata, autoload=True, autoload_with=engine)
    def insert(self, data, log_progress=0):
        print("FareEstimateController.insert()")
        if isinstance(data, list):
            return self.bulk_insert(data, log_progress=log_progress)
        sql = self.table.insert().values(data)
        result = self.engine.execute(sql)
        return result.lastrowid

    def bulk_insert(self, data, log_progress=0):
        # TODO fix this.  Way to slow
        print("FareEstimateController.bulk_insert()")
        inserted_ids = []
        pl = ProgressLogger(total=len(data))
        for d in data:
            pl.iteration()
            sql = self.table.insert().values(d)
            result = self.engine.execute(str(sql), **d)
            inserted_ids.append(result.lastrowid)
        pl.stop()
        return inserted_ids

    def _insert(self, data):
        pass


    def find(self, query=None, options={}):
        # TODO ad offset, order, select fields
        #print("FareEstimateController.find({},{})".format(query, options))
        statement = self.table.select()
        statement = self._add_where_to_statement(statement, query)
            
        if "limit" in options.keys():
            statement = statement.limit(options["limit"])
        statement = str(statement)
        print(statement)
        result = self.engine.execute(statement, options["limit"])
        return result.fetchall()

    def update(self, query=None, values={}):
        statement = self.table.update()
        statement = self._add_where_to_statement(statement, **query)
        result = self.engine.execute(statement)
        return result

    def delete(self, query):
        return self.update(query, {"deletedAt": datetime.datetime.now()})

    def _add_where_to_statement(self, statement, query):
        if query:
            where_clause = re.match("^(WHERE )?(.*)$", query).groups()[1]
            where_text = sqlalchemy.text(where_clause)
            statement = statement.where(where_text)
        return statement

