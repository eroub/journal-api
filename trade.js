const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Trade = sequelize.define('trades', {
  datetime_opened: {
    type: DataTypes.DATE
  },
  datetime_closed: {
    type: DataTypes.DATE
  },
  ticker: {
    type: DataTypes.STRING
  },
  equity: {
    type: DataTypes.DECIMAL(18, 2)
  },
  avg_entry: {
    type: DataTypes.DECIMAL(18, 5)
  },
  stop: {
    type: DataTypes.DECIMAL(18, 5)
  },
  target: {
    type: DataTypes.DECIMAL(18, 5)
  },
  close: {
    type: DataTypes.DECIMAL(18, 5)
  },
  size: {
    type: DataTypes.DECIMAL(18, 5)
  },
  real_pnl: {
    type: DataTypes.DECIMAL(18, 5)
  }
}, {
  timestamps: false
});

module.exports = Trade;
