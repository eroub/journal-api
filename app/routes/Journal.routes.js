const { authMiddleware } = require('../../server');

module.exports = app => {
    var router = require("express").Router();
    const journal = require("../controllers/Journal.controller");
    

    // Retrieve all trades
    router.get("/", journal.getAllTrades);
    // Create a new new trade
    router.post("/", authMiddleware, journal.createTrade);
    // Update a trade
    router.post("/update", authMiddleware, journal.updateTrade);
    // Delete a trade
    // **Not for frontend use
    router.delete("/:tradeID", authMiddleware, journal.delete);

    app.use('/api/trades', router);
};
