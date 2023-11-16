module.exports = (sequelize, Sequelize) => {
  const Journal = sequelize.define('trade_journal', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID'
    },
    accountID: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Account',
        key: 'accountID'
      }
    },
    datetimeIn: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'Datetime_In'
    },
    datetimeOut: {
      type: Sequelize.DATE,
      field: 'Datetime_Out'
    },
    totalHrs: {
      type: Sequelize.FLOAT,
      field: 'Total_Hrs'
    },
    ticker: {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'Ticker'
    },
    direction: {
      type: Sequelize.ENUM('Long', 'Short'),
      allowNull: false,
      field: 'Direction'
    },
    equity: {
      type: Sequelize.FLOAT,
      field: 'Equity'
    },
    entry: {
      type: Sequelize.FLOAT,
      field: 'Entry'
    },
    stopLoss: {
      type: Sequelize.FLOAT,
      field: 'Stop_Loss'
    },
    target: {
      type: Sequelize.FLOAT,
      field: 'Target'
    },
    size: {
      type: Sequelize.INTEGER,
      field: 'Size'
    },
    risk: {
      type: Sequelize.FLOAT,
      field: 'Risk'
    },
    estGain: {
      type: Sequelize.FLOAT,
      field: 'Est_Gain'
    },
    estRR: {
      type: Sequelize.FLOAT,
      field: 'Est_RR'
    },
    exitPrice: {
      type: Sequelize.FLOAT,
      field: 'Exit_Price'
    },
    projPL: {
      type: Sequelize.FLOAT,
      field: 'Proj_PL'
    },
    realPL: {
      type: Sequelize.FLOAT,
      field: 'Real_PL'
    },
    commission: {
      type: Sequelize.FLOAT,
      field: 'Commission'
    },
    percentChange: {
      type: Sequelize.FLOAT,
      field: 'Percent_Change'
    },
    realRR: {
      type: Sequelize.FLOAT,
      field: 'Real_RR'
    },
    pips: {
      type: Sequelize.FLOAT,
      field: 'Pips'
    },
    mfe: {
      type: Sequelize.FLOAT,
      field: 'MFE'
    },
    mae: {
      type: Sequelize.FLOAT,
      field: 'MAE'
    },
    mfeRatio: {
      type: Sequelize.FLOAT,
      field: 'MFE_Ratio'
    },
    maeRatio: {
      type: Sequelize.FLOAT,
      field: 'MAE_Ratio'
    },
    type: {
      type: Sequelize.TEXT,
      field: 'Type'
    },
    screenshot: {
      type: Sequelize.TEXT,
      field: 'Screenshot'
    },
    comment: {
      type: Sequelize.TEXT,
      field: 'Comment'
    },
    status: {
      type: Sequelize.ENUM('Open', 'Closed'),
      allowNull: false,
      defaultValue: 'Open',
      field: 'Status'
    }
  }, {
    tableName: 'trade_journal',
    timestamps: false
  });

  return Journal;
};
