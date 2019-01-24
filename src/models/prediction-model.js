const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
});


const Model = sequelize.define("prediction_model", {
    model_json: Sequelize.STRING,
    name: Sequelize.STRING
}, {
    timestamps: true,
    paranoid: true
});

sequelize.sync()

export default Model;
