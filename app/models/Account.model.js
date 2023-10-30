module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define('Account', {
      accountID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
  