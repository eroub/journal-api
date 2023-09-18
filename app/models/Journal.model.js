module.exports = (sequelize, Sequelize) => {
  const Trade = sequelize.define('trade_journal', {
    ID: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Datetime_In: {
      type: Sequelize.DATE
    },
    Datetime_Out: {
      type: Sequelize.DATE
    },
    Total_Hrs: {
      type: Sequelize.FLOAT
    },
    Ticker: {
      type: Sequelize.STRING
    },
    Direction: {
      type: Sequelize.ENUM('Long', 'Short')
    },
    Equity: {
      type: Sequelize.FLOAT
    },
    Entry: {
      type: Sequelize.FLOAT
    },
    Stop_Loss: {
      type: Sequelize.FLOAT
    },
    Target: {
      type: Sequelize.FLOAT
    },
    Size: {
      type: Sequelize.INTEGER
    },
    Risk: {
      type: Sequelize.FLOAT
    },
    Risk_USD: {
      type: Sequelize.FLOAT
    },
    Est_Gain: {
      type: Sequelize.FLOAT
    },
    Est_Gain_USD: {
      type: Sequelize.FLOAT
    },
    Est_RR: {
      type: Sequelize.FLOAT
    },
    Exit_Price: {
      type: Sequelize.FLOAT
    },
    Proj_PL: {
      type: Sequelize.FLOAT
    },
    Proj_PL_USD: {
      type: Sequelize.FLOAT
    },
    Real_PL: {
      type: Sequelize.FLOAT
    },
    Commission: {
      type: Sequelize.FLOAT
    },
    Percent_Change: {
      type: Sequelize.FLOAT
    },
    Real_RR: {
      type: Sequelize.FLOAT
    },
    Pips: {
      type: Sequelize.FLOAT
    },
    MFE: {
      type: Sequelize.FLOAT
    },
    MAE: {
      type: Sequelize.FLOAT
    },
    MFE_Ratio: {
      type: Sequelize.FLOAT
    },
    MAE_Ratio: {
      type: Sequelize.FLOAT
    },
    Type: {
      type: Sequelize.TEXT
    },
    Screenshot: {
      type: Sequelize.TEXT
    },
    Comment: {
      type: Sequelize.TEXT
    }
  }, {
    tableName: 'trade_journal',
    timestamps: false
  });
}