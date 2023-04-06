const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// User CORS and BodyParser
if(process.env.APP_URL) {
  const urlWithoutTrailingSlash = process.env.APP_URL.endsWith('/') ? process.env.APP_URL.slice(0, -1) : process.env.APP_URL;
  app.use(cors({origin: urlWithoutTrailingSlash}))
} else {
  app.use(cors());
}

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