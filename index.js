const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// PRECIO REAL ORO
app.get('/price', async (req, res) => {
  try {
    const r = await fetch('https://api.twelvedata.com/price?symbol=XAU/USD&apikey=38f4424f90b04cf4a38c57a7c12fd03e
    const data = await r.json();

    res.json({
      price: parseFloat(data.price)
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000);
