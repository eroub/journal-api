module.exports = (sequelize, Sequelize) => {
  const FuturesContractSpecs = sequelize.define("FuturesContractSpecs", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    symbol: {
      type: Sequelize.STRING(10),
      allowNull: false
    },
    tickSize: {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    },
    pointValue: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'FuturesContractSpecs',
    timestamps: false
  });

  return FuturesContractSpecs;
};
