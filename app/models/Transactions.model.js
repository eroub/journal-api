// Transactions.model.js
module.exports = (sequelize, Sequelize) => {
    const Transactions = sequelize.define('Transactions', {
      transactionID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      accountID: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Account',
          key: 'accountID'
        }
      },
      type: {
        type: Sequelize.ENUM('Inflow', 'Outflow'),
        allowNull: false
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }, {
      timestamps: false
    });
    return Transactions;
  };
  