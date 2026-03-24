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

// 👉 CARGA TU HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 👉 PRECIO REAL DEL ORO (XAUUSD)
app.get('/price', async (req, res) => {
  try {
    const r = await fetch('https://api.twelvedata.com/price?symbol=XAU/USD&apikey=TU_API_KEY');
    const data = await r.json();

    res.json({
      price: parseFloat(data.price)
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 👉 IA SIGNAL (OPCIONAL)
app.post('/signal', async (req, res) => {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: req.body.prompt || "Give me trading signal JSON"
          }
        ]
      })
    });

    const data = await r.json();
    res.json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000);
