// Account.routes.js
const { jwtMiddleware } = require('../../server');
const accountController = require("../controllers/Account.controller");

module.exports = app => {
  var router = require("express").Router();

  // Retrieve equity amounts for each account of logged in user
  router.get("/equityAmounts", jwtMiddleware, accountController.getEquityAmountsForUser);

  // Update an account's equity
  router.put("/updateEquity/:id", jwtMiddleware, accountController.updateAccountEquity);

  app.use('/api/accounts', router);
};
