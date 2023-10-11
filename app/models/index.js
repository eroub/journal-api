const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize('trade_journal', process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_SERVER,
  dialect: 'mysql',
  timezone: 'America/Edmonton'
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.Journal = require("./Journal.model.js")(sequelize, Sequelize);

module.exports = db;
