const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const dotenv = require('dotenv');

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

// Export basic auth middleware
module.exports.authMiddleware = authMiddleware = basicAuth({
  users: { [process.env.AUTH_USER]: process.env.AUTH_PASS },
  challenge: true,
  unauthorizedResponse: function(req) {
    return req.auth
      ? ('Credentials for user ' + req.auth.user + ' rejected')
      : 'Unauthorized: No credentials provided';
  },
  authorizeAsync: true,
  authorizer: (username, password, callback) => {
    console.log("Authorizing:", username, password);
    if (username === process.env.AUTH_USER && password === process.env.AUTH_PASS) {
      return callback(null, true);
    } else {
      return callback(null, false);
    }
  }  
});

app.use(express.json());

// Connect to DB
const db = require("./app/models/");
db.sequelize.sync();

// An endpoint to authenticate users
app.get('/auth', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Authentication successful' });
});

// Routing for trades
require("./app/routes/Journal.routes")(app);

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
