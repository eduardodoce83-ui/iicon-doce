const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers','*');
  res.header('Access-Control-Allow-Methods','*');
  if(req.method==='OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/signal', async (req,res)=>{
  try {
    // 1. Precio real de XAU/USD via Twelve Data
    const priceRes = await fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${process.env.TWELVEDATA_KEY}`);
    const priceData = await priceRes.json();
    const currentPrice = parseFloat(priceData.price) || 0;

    // 2. Señal via Claude con precio real
    const prompt = `You are a professional XAU/USD intraday trader. Current XAU/USD price right now: $${currentPrice}. Today: ${new Date().toUTCString()}. Analyze this price with technical analysis and give a precise trading signal. Respond ONLY in JSON: {"signal":"BUY or SELL or WAIT","price":${currentPrice},"change_pct":number,"entry":number,"stop_loss":number,"take_profit":number,"confidence":number 0-100,"analysis":"3 sentences in Spanish explaining the signal"}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':process.env.ANTHROPIC_KEY,
        'anthropic-version':'2023-06-01'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        messages:[{role:'user',content:prompt}]
      })
    });

    const claudeData = await claudeRes.json();
    const textBlock = claudeData.content?.find(b=>b.type==='text');
    const match = textBlock?.text?.match(/\{[\s\S]*\}/);
    const signal = JSON.parse(match ? match[0] : '{}');
    signal.price = signal.price || currentPrice;
    res.json(signal);

  } catch(e){
    res.status(500).json({error:e.message});
  }
});

app.get('/price', async (req,res)=>{
  try {
    const r = await fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${process.env.TWELVEDATA_KEY}`);
    const d = await r.json();
    res.json(d);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.listen(process.env.PORT||3000, ()=>console.log('IICON.DOCE servidor activo'));
