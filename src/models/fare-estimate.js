const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
});


const FareEstimate = sequelize.define("fare_estimate", {
    type: Sequelize.STRING,
    value: Sequelize.INTEGER,
    time: Sequelize.DATE
}, {
    timestamps: true
});

sequelize.sync()

export default FareEstimate;
