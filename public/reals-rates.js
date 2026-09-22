const REAL={sA:1.03,p:{BNB:360000,BTC:35000000,XOF:605},async load(){
try{
const [b,bt,fx]=await Promise.all([
fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT').then(r=>r.json()),
fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT').then(r=>r.json()),
fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json())
]);
const xof=fx.rates.XOF;
this.p.BNB=parseFloat(b.price)*xof;
this.p.BTC=parseFloat(bt.price)*xof;
this.p.XOF=xof;
window.BNB_PRICE=this.p.BNB*this.sA;
window.BTC_PRICE=this.p.BTC*this.sA;
window.USDT_PRICE=xof*this.sA;
if(typeof calc==='function') calc();
console.log("✅ LIVE",this.p);
}catch(e){console.log(e)}}};REAL.load();setInterval(()=>REAL.load(),15000);
