const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// User CORS and BodyParser
const allowedOrigins = ['http://roubekas.com', 'http://www.roubekas.com', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));


app.use(express.json());

const Trade = require('./trade');

// Create a new trade entry
app.post('/api/trades', async (req, res) => {
  try {
    const trade = await Trade.create(req.body);
    res.status(201).json(trade);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all trade entries
app.get('/api/trades', async (req, res) => {
  try {
    const trades = await Trade.findAll();
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});