module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define('Account', {
      accountID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      equity: {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
        defaultValue: 0.00
      },
      defaultRiskPercent: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: false,
        defaultValue: 0.00
      },
      accountName: Sequelize.STRING,
      userID: {
        type: Sequelize.INTEGER,
        references: {
          model: 'User',
          key: 'userID'
        }
      }
    }, {
      timestamps: false
    });
    return Account;
  };
  