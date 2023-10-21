module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('User', {
      userID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: Sequelize.STRING,
      password: Sequelize.STRING,
      email: Sequelize.STRING
    });
    return User;
  };
  