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
  unauthorizedResponse: 'Unauthorized'
});

app.use(express.json());

// Connect to DB
const db = require("./app/models/");
db.sequelize.sync();

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
