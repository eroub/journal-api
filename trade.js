const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Trade = sequelize.define('trade_journal', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Datetime_In: {
    type: DataTypes.DATE
  },
  Datetime_Out: {
    type: DataTypes.DATE
  },
  Total_Hrs: {
    type: DataTypes.FLOAT
  },
  Ticker: {
    type: DataTypes.STRING
  },
  Direction: {
    type: DataTypes.ENUM('Long', 'Short')
  },
  Equity: {
    type: DataTypes.FLOAT
  },
  Entry: {
    type: DataTypes.FLOAT
  },
  Stop_Loss: {
    type: DataTypes.FLOAT
  },
  Target: {
    type: DataTypes.FLOAT
  },
  Size: {
    type: DataTypes.INTEGER
  },
  Risk: {
    type: DataTypes.FLOAT
  },
  Risk_USD: {
    type: DataTypes.FLOAT
  
  },
  Est_Gain: {
    type: DataTypes.FLOAT
  },
  Est_Gain_USD: {
    type: DataTypes.FLOAT
  },
  Est_RR: {
    type: DataTypes.FLOAT
  },
  Exit_Price: {
    type: DataTypes.FLOAT
  },
  Proj_PL: {
    type: DataTypes.FLOAT
  },
  Proj_PL_USD: {
    type: DataTypes.FLOAT
  },
  Real_PL: {
    type: DataTypes.FLOAT
  },
  Commission: {
    type: DataTypes.FLOAT
  },
  Percent_Change: {
    type: DataTypes.FLOAT
  },
  Real_RR: {
    type: DataTypes.FLOAT
  },
  Pips: {
    type: DataTypes.FLOAT
  },
  MFE: {
    type: DataTypes.FLOAT
  },
  MAE: {
    type: DataTypes.FLOAT
  },
  MFE_Ratio: {
    type: DataTypes.FLOAT
  },
  MAE_Ratio: {
    type: DataTypes.FLOAT
  },
  Type: {
    type: DataTypes.TEXT
  },
  Screenshot: {
    type: DataTypes.TEXT
  },
  Comment: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: false
});

module.exports = Trade;
