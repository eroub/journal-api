const db = require("../models/index");
const Transactions = db.Transactions;
const Account = db.Account;

// Read transactions for a specific account
exports.getTransactions = async (req, res) => {
    try {
        const accountID = req.params.accountID;
        const userID = req.user.userID;

        // Verify ownership of accountID
        const account = await Account.findOne({ where: { accountID, userID } });
        if (!account) return res.status(403).json({ message: "Unauthorized access" });

        // Fetch transactions
        const transactions = await Transactions.findAll({
            where: { accountID }
        });

        return res.status(200).json({ transactions });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { accountID, type, amount, date } = req.body;
        const userID = req.user.userID;

        // Verify ownership of accountID
        const account = await Account.findOne({ where: { accountID, userID } });
        if (!account) return res.status(403).json({ message: "Unauthorized access" });

        // Create new transaction
        const newTransaction = await Transactions.create({
            accountID,
            type,
            amount,
            date
        });

        return res.status(201).json({ message: 'New transaction created', transaction: newTransaction });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
