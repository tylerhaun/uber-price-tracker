ALTER TABLE fare_estimates ADD COLUMN predicted TINYINT;
ALTER TABLE fare_estimates ADD COLUMN deletedAt DATETIME;
ALTER TABLE prediction_models ADD COLUMN deletedAt DATETIME;
