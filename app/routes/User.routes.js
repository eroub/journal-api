module.exports = app => {
    const router = require("express").Router();
    const users = require("../controllers/Users.controller");

    // Create a new user account
    // Note: This route is not protected by JWT middleware
    router.post("/create", users.createUser);

    // Create a new trade account for logged-in user
    // This route is protected by JWT middleware
    router.post("/create-trade-account", jwtMiddleware, users.createTradeAccount);


    app.use('/api/users', router);
};
