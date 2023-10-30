const { jwtMiddleware } = require('../../server');

module.exports = app => {
    const router = require("express").Router();
    const transactions = require("../controllers/Transactions.controller");

    // Read transactions for a specific account
    // This route is protected by JWT middleware
    router.get("/:accountID", jwtMiddleware, transactions.getTransactions);

    // Create a new transaction
    // This route is protected by JWT middleware
    router.post("/create", jwtMiddleware, transactions.createTransaction);

    app.use('/api/transactions', router);
};
