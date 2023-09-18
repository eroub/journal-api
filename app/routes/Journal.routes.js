module.exports = app => {
    var router = require("express").Router();
    const journal = require("../controllers/Journal.controller");
    

    // Retrieve all trades
    router.get("/", journal.getAllTrades);
    // Create a new new trade
    router.post("/", journal.createTrade);
    // Update a trade
    router.post("/update", journal.updateTrade);
    // Delete a trade
    // **Not for frontend use
    router.delete("/:tradeID", journal.delete);

    app.use('/api/trades', router);
};
