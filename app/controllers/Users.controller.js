const db = require("../models/index");
const Account = db.Account;
const User = db.User;
const bcrypt = require('bcrypt');

// Create a new user account
exports.createUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hash the password before storing it
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Create the new user
        const newUser = await User.create({
            username: username,
            password: hashedPassword
        });

        return res.status(201).json({ message: 'User created', user: newUser });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Create a new trade account for logged-in user
exports.createTradeAccount = async (req, res) => {
    try {
        const userID = req.user.userID; // Assuming the userID is in the JWT payload
        const { accountName } = req.body; // New account name from request body

        if (!accountName) {
            return res.status(400).json({ message: 'Account name is required' });
        }

        // Check if the account name already exists for this user
        const existingAccount = await Account.findOne({
            where: {
                accountName: accountName,
                userID: userID
            }
        });

        if (existingAccount) {
            return res.status(400).json({ message: 'Account with this name already exists' });
        }

        // Create new account
        const newAccount = await Account.create({
            accountName: accountName,
            userID: userID
        });

        return res.status(201).json({ message: 'New account created', account: newAccount });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// Get accounts for logged-in user
exports.getUserAccounts = async (req, res) => {
    try {
        const userID = req.user.userID;

        // Fetch accounts for this user
        const accounts = await Account.findAll({
            where: {
                userID: userID
            }
        });

        return res.status(200).json(accounts);
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: error.message });
    }
};
