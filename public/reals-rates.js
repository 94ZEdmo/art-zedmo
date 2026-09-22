// LIVE FORCE - écrase les prix fixes
async function updateLive(){
 try{
  const [bnb,btc,eth,fx]=await Promise.all([
   fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT').then(r=>r.json()),
   fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT').then(r=>r.json()),
   fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT').then(r=>r.json()),
   fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json())
  ]);
  const xof=fx.rates.XOF||573.24;
  const PRICES={
    BNB: parseFloat(bnb.price)*xof,
    BTC: parseFloat(btc.price)*xof,
    ETH: parseFloat(eth.price)*xof,
    USDT: xof
  };
  // Expose global pour ton calc() existant
  window.BNB_PRICE_BASE=PRICES.BNB;
  window.BTC_PRICE_BASE=PRICES.BTC;
  window.ETH_PRICE_BASE=PRICES.ETH;
  window.USDT_PRICE_BASE=PRICES.USDT;
  // Si ton index.html a des variables p ou prices
  window.REAL_PRICES=PRICES;
  console.log("✅ LIVE UPDATED",PRICES);
  // Forcer le recalcul de l'interface
  if(typeof calc==='function') calc();
  if(typeof updateTotal==='function') updateTotal();
  // Met à jour directement le texte "Vous recevrez"
  const evt=new Event('input');
  document.querySelectorAll('input').forEach(i=>i.dispatchEvent(evt));
 }catch(e){console.log("LIVE error",e)}
}
updateLive();
setInterval(updateLive,10000);
