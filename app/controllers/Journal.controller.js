// Journal.controller.js
const db = require("../models/index");
const Journal = db.Journal;
const Account = db.Account;

// Get all trades
exports.getAllTrades = async (req, res) => {
    try {
        const trades = await Journal.findAll();
        return res.status(201).json(trades);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
}

// Get all trades for a specific user
exports.getAllTradesForUser = async (req, res) => {
  try {
      const userID = req.user.userID; // Get userID from JWT

      // Fetch trades for the given user across all accounts
      const trades = await Journal.findAll({
          where: { userID: userID }
      });

      return res.status(200).json({ trades });
  } catch (error) {
      return res.status(400).json({ error: error.message });
  }
};

// Get all trades for a specific account and user
exports.getAllTradesForAccount = async (req, res) => {
  try {
      const accountID = req.params.accountID;
      const userID = req.user.userID; // Get userID from JWT

      // Fetch trades for the given account and user
      const trades = await Journal.findAll({
          where: { accountID: accountID, userID: userID }
      });

      return res.status(200).json({ trades });
  } catch (error) {
      return res.status(400).json({ error: error.message });
  }
};

// Create a new trade entry with a transaction
exports.createTrade = async (req, res) => {
    // Start a new transaction
    const t = await db.sequelize.transaction();  // Replace `sequelize` with your Sequelize instance if needed
    try {
      // Create a new trade within the transaction scope
      const trade = await Journal.create(req.body, { transaction: t });
      // Commit the transaction
      await t.commit();
      // console.log("Trade Created:", trade);  // Debug: Log the created trade
      return res.status(201).json(trade);
    } catch (error) {
      // Rollback the transaction in case of errors
      await t.rollback();
      console.log("Error:", error);  // Debug: Log the error message
      return res.status(400).json({ error: error.message });
    }
}

// Update a Trade by the id in the request
// This also updates the accounts equity
exports.updateTrade = async (req, res) => {
  const tradeID = req.body.id;
  const accountID = req.body.accountID;
  try {
    const [updatedTradeRows] = await Journal.update(req.body, {
      where: { id: tradeID }
    });

    if (updatedTradeRows === 0) {
      res.status(404).send({
        message: `Cannot update Trade with id=${tradeID}. Maybe Trade was not found or req.body is empty!`
      });
      return;
    }

    // Update the account's equity
    const [updatedAccountRows] = await Account.update({ equity: req.body.postEquity }, {
      where: { accountID: accountID }
    });

    if (updatedAccountRows === 0) {
      res.status(404).send({
        message: `Cannot update Account with accountID=${accountID}. Maybe Account was not found!`
      });
    } else {
      res.send({ message: "Trade and associated Account were updated successfully." });
    }
  } catch (error) {
    res.status(500).send({
      message: `Error updating Trade with id=${tradeID} or Account with accountID=${accountID}`
    });
  }
};

// Delete a Trade with the specified id in the request
exports.delete = async (req, res) => {
  const tradeID = req.params.tradeID;

  try {
    const deletedRows = await Journal.destroy({
      where: { ID: tradeID }
    });

    if (deletedRows === 0) {
      res.status(404).send({
        message: `Cannot delete Trade with id=${tradeID}. Maybe Trade was not found!`
      });
    } else {
      // Find the max ID in the table
      const maxIDResult = await db.sequelize.query('SELECT MAX(ID) as maxID FROM trade_journal', {
        type: db.sequelize.QueryTypes.SELECT
      });
      const maxID = maxIDResult[0].maxID || 0;

      // Reset the auto-increment counter
      await db.sequelize.query(`ALTER TABLE trade_journal AUTO_INCREMENT = ${maxID + 1}`);

      res.send({ message: "Trade was deleted successfully!" });
    }
  } catch (error) {
    res.status(500).send({
      message: `Could not delete Trade with id=${tradeID}`
    });
  }
};