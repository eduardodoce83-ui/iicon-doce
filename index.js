const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());
app.use((req,res,next)=>{res.header('Access-Control-Allow-Origin','*');res.header('Access-Control-Allow-Headers','*');next();});

app.post('/signal', async (req,res)=>{
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,tools:[{type:'web_search_20250305',name:'web_search'}],messages:[{role:'user',content:`You are a professional XAU/USD trader. Search for the current gold price and give a trading signal. Respond ONLY in JSON: {"signal":"BUY or SELL or WAIT","price":number,"change_pct":number,"entry":number,"stop_loss":number,"take_profit":number,"confidence":number,"analysis":"3 sentences in Spanish"}`}]})
    });
    const d = await r.json();
    const t = d.content?.find(b=>b.type==='text');
    const m = t?.text?.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(m?m[0]:'{}'));
  } catch(e){res.status(500).json({error:e.message});}
});

app.listen(process.env.PORT||3000);
