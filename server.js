const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const dotenv = require('dotenv');

// Authentication
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


dotenv.config();
const app = express();

// User CORS and BodyParser
const allowedOrigins = ['http://roubekas.com', 'http://www.roubekas.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']; 
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  }
}));

// Export JWT middleware
module.exports.jwtMiddleware = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).send('No token provided');
  // Extract the token from the Authorization header
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).send('Malformed token');
  }
  const token = tokenParts[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log("Token:", token);
    if (err) {
      console.log("JWT Error:", err);
      return res.status(401).send('Unauthorized');
    }
    // User is authenticated
    req.user = decoded;
    next();
  });
};

app.use(express.json());

// Connect to DB
const db = require("./app/models/");
db.sequelize.sync();

// An endpoint to authenticate users
app.post('/auth', async (req, res) => {
  const { username, password } = req.body;

  // Fetch hashed password and userID from database
  const query = "SELECT password, userID FROM Users WHERE username = ?";
  let [rows] = await db.sequelize.query(query, {
    replacements: [username]
  });
  const hashedPassword = rows[0]?.password;
  const userID = rows[0]?.userID;

  // Verify password
  const validCredentials = bcrypt.compareSync(password, hashedPassword);
  if (validCredentials) {
    const token = jwt.sign({ username, userID }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Routing for trades
require("./app/routes/Journal.routes")(app);
// Routing for Users
require("./app/routes/User.routes")(app);
// Routing for Transactions
require("./app/routes/Transactions.routes")(app);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// For graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
