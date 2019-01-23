const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
});


const Model = sequelize.define("prediction_model", {
    modelJson: Sequelize.STRING,
    name: Sequelize.STRING
}, {
    timestamps: true
});

sequelize.sync()

export default Model;
