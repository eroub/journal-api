const { jwtMiddleware } = require('../../server');

module.exports = app => {
    var router = require("express").Router();
    const journal = require("../controllers/Journal.controller");
    

    // Retrieve all trades
    router.get("/", journal.getAllTrades);
    // Retrieve all trades for a specific user across all accounts
    router.get("/user", jwtMiddleware, journal.getAllTradesForUser);
    // Retrieve all trades for a specific account and user
    router.get("/account/:accountID", jwtMiddleware, journal.getAllTradesForAccount);
    // Create a new new trade
    router.post("/", jwtMiddleware, journal.createTrade);
    // Update a trade
    router.post("/update", jwtMiddleware, journal.updateTrade);
    // Delete a trade
    // **Not for frontend use
    router.delete("/:tradeID", jwtMiddleware, journal.delete);

    app.use('/api/trades', router);
};
