// index.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize('trade_journal', process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_SERVER,
  dialect: 'mysql',
  timezone: '+00:00'
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
db.User = require("./User.model.js")(sequelize, Sequelize);
db.Account = require("./Account.model.js")(sequelize, Sequelize);
db.Journal = require("./Journal.model.js")(sequelize, Sequelize);
db.Transactions = require("./Transactions.model.js")(sequelize, Sequelize);
db.FuturesContractSpecs = require("./FuturesContractSpecs.model.js")(sequelize, Sequelize);

// Relationships
db.User.hasMany(db.Account, { foreignKey: 'userID' });  // One-to-Many between User and Account
db.Account.belongsTo(db.User, { foreignKey: 'userID' });

db.Account.hasOne(db.Journal, { foreignKey: 'accountID' });  // One-to-One between Account and Journal
db.Journal.belongsTo(db.Account, { foreignKey: 'accountID' });

db.Account.hasOne(db.Transactions, { foreignKey: 'accountID' });  // One-to-One between Account and Transactions
db.Transactions.belongsTo(db.Account, { foreignKey: 'accountID' });

module.exports = db;
