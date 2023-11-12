// Account.controller.js
const db = require("../models/index");
const Account = db.Account;

// Get the equity amounts for each account associated with the logged-in user
exports.getEquityAmountsForUser = async (req, res) => {
    const userID = req.user.userID; // Assuming userID is attached to req.user by your authentication middleware
    
    try {
      const accounts = await Account.findAll({
        where: { userID: userID },
        attributes: ['accountID', 'accountName', 'equity', 'defaultRiskPercent'] // Select only required fields
      });
  
      res.send(accounts);
    } catch (error) {
      res.status(500).send({
        message: "Error retrieving equity amounts for the user's accounts"
      });
    }
  };

// Update an Account's equity by the accountID in the request
exports.updateAccountEquity = async (req, res) => {
  const accountID = req.params.id;
  const newEquity = req.body.equity;
  
  try {
    const [updatedRows] = await Account.update({ equity: newEquity }, {
      where: { accountID: accountID }
    });

    if (updatedRows === 0) {
      res.status(404).send({
        message: `Cannot update Account with accountID=${accountID}. Maybe Account was not found or req.body is empty!`
      });
    } else {
      res.send({ message: "Account equity was updated successfully." });
    }
  } catch (error) {
    res.status(500).send({
      message: `Error updating Account with accountID=${accountID}`
    });
  }
};
