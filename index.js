const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// CORS
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers','*');
  res.header('Access-Control-Allow-Methods','*');
  if(req.method==='OPTIONS') return res.sendStatus(200);
  next();
});

// ✅ ESTO ARREGLA "Cannot GET /"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 👉 SEÑAL
app.post('/signal', async (req,res)=>{
  try {

    // PRECIO REAL
    const priceRes = await fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${process.env.TWELVEDATA_KEY}`);
    const priceData = await priceRes.json();
    const currentPrice = parseFloat(priceData.price) || 0;

    // PROMPT IA
    const prompt = `You are a professional XAU/USD intraday trader. Current XAU/USD price: $${currentPrice}. Respond ONLY JSON: {"signal":"BUY or SELL or WAIT","price":${currentPrice},"change_pct":number,"entry":number,"stop_loss":number,"take_profit":number,"confidence":number,"analysis":"3 sentences in Spanish"}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':process.env.ANTHROPIC_KEY,
        'anthropic-version':'2023-06-01'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:500,
        messages:[{role:'user',content:prompt}]
      })
    });

    const claudeData = await claudeRes.json();
    const textBlock = claudeData.content?.find(b=>b.type==='text');
    const match = textBlock?.text?.match(/\{[\s\S]*\}/);

    let signal = {};
    if(match){
      signal = JSON.parse(match[0]);
    }

    signal.price = currentPrice;

    res.json(signal);

  } catch(e){
    res.status(500).json({error:e.message});
  }
});

// 👉 SOLO PRECIO
app.get('/price', async (req,res)=>{
  try {
    const r = await fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${process.env.TWELVEDATA_KEY}`);
    const d = await r.json();
    res.json(d);
  } catch(e){
    res.status(500).json({error:e.message});
  }
});

app.listen(process.env.PORT||3000, ()=>{
  console.log('🔥 IICON.DOCE RUNNING');
});
