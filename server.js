const express=require('express'),fs=require('fs'),path=require('path'),cors=require('cors');
const nodemailer = require('nodemailer');
const app=express();
const ADMIN_KEY=process.env.ADMIN_KEY||'ZEDMO_2026_CHANGE_MOI_!@#';
const DB=path.join(__dirname,'transactions.json');
const USERS_DB=path.join(__dirname,'users.json');
const DB_KYC=path.join(__dirname,'kyc.json');
const DB_OTP=path.join(__dirname,'otp.json');
const WHATSAPP_NUM='229194655238';

app.use(cors());
app.use(express.json({limit:'20mb'}));
app.use(express.static(path.join(__dirname,'public')));
if(!fs.existsSync(DB)) fs.writeFileSync(DB,'[]');
if(!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB,'[]');
if(!fs.existsSync(DB_KYC)) fs.writeFileSync(DB_KYC,'[]');
if(!fs.existsSync(DB_OTP)) fs.writeFileSync(DB_OTP,'{}');

function read(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return []}}
function save(p,d){fs.writeFileSync(p,JSON.stringify(d,null,2))}
function adminAuth(req,res,next){ if(req.headers['x-admin-key']!==ADMIN_KEY && req.query.key!==ADMIN_KEY) return res.status(401).json({error:'Unauthorized'}); next(); }

// === SEULEMENT AJOUT EMAIL - NE TOUCHE RIEN D'AUTRE ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
function sendEmail(to, subject, html){
  if(!to ||!to.includes('@')) return;
  transporter.sendMail({ from: `"ART ZEDMO" <${process.env.EMAIL_USER}>`, to, subject, html })
 .then(()=>console.log(`📧 Email à ${to}`))
 .catch(e=>console.log('Email err:',e.message));
}

app.post('/api/register',(req,res)=>{
 let {name,phone,email,pass}=req.body;
 if(!name||!phone||!pass||phone.length<8) return res.status(400).json({error:'invalide'});
 let users=read(USERS_DB);
 if(users.find(u=>u.phone===phone)) return res.status(400).json({error:'Deja inscrit'});
 let u={name,phone,email:email||'',pass,date:new Date().toISOString(), balances:{BTC:0,ETH:0,BNB:0,USDT_TRC20:0,USDT_BEP20:0,USDT_ERC20:0,FCFA:0}, kycStatus:'Non vérifié'};
 users.push(u); save(USERS_DB,users); res.json({ok:true});
});

// === MODIF 1: TRANSACTION EN ATTENTE + EMAIL CLIENT (pas WhatsApp notif) ===
app.post('/api/transaction',(req,res)=>{
 let {amount,cryptoAmount,type,country,operator,phonePay,phoneRec,crypto,address,depositTo,user}=req.body;
 if(!type||!crypto) return res.status(400).json({error:'manquant'});
 let tx={type,country,operator,crypto,address,depositTo,phonePay:String(phonePay||'').trim(),phoneRec:String(phoneRec||'').trim(),amount:amount?parseFloat(amount):undefined,cryptoAmount:cryptoAmount?parseFloat(cryptoAmount):undefined,user:user?{name:user.name,phone:user.phone,email:user.email}:null,id:String(Date.now())+Math.floor(Math.random()*1000),status:'En attente ⏳',date:new Date().toISOString(), kind:'exchange'};
 let all=read(DB); all.push(tx); save(DB,all);
 if(user?.email){
   sendEmail(user.email, `Transaction ${tx.id} En attente ⏳ - ART ZEDMO`,
   `<div style="font-family:sans-serif;background:#070f1c;color:#fff;padding:20px;border-radius:12px">
   <h2 style="color:#ffaa00">Transaction en attente ⏳</h2>
   <p>Bonjour ${user.name},</p>
   <div style="background:#111f2e;padding:12px;border-radius:8px">ID: ${tx.id}<br>Type: ${tx.type}<br>Montant: ${tx.amount||tx.cryptoAmount} ${tx.crypto}<br>Statut: En attente ⏳</div>
   <p>L'admin va valider. Besoin d'aide? WhatsApp: 01 94 65 52 38</p></div>`);
 }
 res.json({ok:true,tx});
});

app.get('/api/my-balance',(req,res)=>{
 let phone=String(req.query.phone||'').trim();
 let users=read(USERS_DB); let u=users.find(x=>x.phone===phone);
 if(!u) return res.json({balances:{}});
 res.json({balances:u.balances||{}});
});

app.post('/api/wallet/deposit',(req,res)=>{
 let {phone,crypto,txHash}=req.body;
 if(!phone||!crypto) return res.status(400).json({error:'manquant'});
 let all=read(DB);
 let dep={id:String(Date.now()),type:'Depot Wallet',crypto,txHash:txHash||'',phonePay:phone,user:{phone},status:'En attente',date:new Date().toISOString(), kind:'deposit'};
 all.push(dep); save(DB,all); res.json({ok:true, dep});
});

app.post('/api/wallet/withdraw',(req,res)=>{
 let {phone,crypto,amount,address}=req.body;
 let amt=parseFloat(amount); if(!phone||!crypto||!amt||amt<=0||!address) return res.status(400).json({error:'invalide'});
 let users=read(USERS_DB); let u=users.find(x=>x.phone===phone);
 if(!u) return res.status(404).json({error:'user'});
 if((u.balances[crypto]||0) < amt) return res.status(400).json({error:'Solde insuffisant'});
 u.balances[crypto]-=amt; save(USERS_DB,users);
 let all=read(DB);
 let wd={id:String(Date.now()),type:'Retrait Wallet',crypto,cryptoAmount:amt,address,phoneRec:phone,user:{name:u.name,phone:u.phone,email:u.email},status:'En attente',date:new Date().toISOString(), kind:'withdraw'};
 all.push(wd); save(DB,all); res.json({ok:true});
});

app.get('/api/my-transactions',(req,res)=>{
 let phone=String(req.query.phone||'').trim(); if(!phone||phone.length<8) return res.json([]);
 let all=read(DB); res.json(all.filter(t=> String(t.phonePay)===phone || String(t.phoneRec)===phone || String(t.user?.phone)===phone ));
});
app.get('/api/admin/transactions',adminAuth,(req,res)=>res.json(read(DB)));
app.get('/api/admin/users',adminAuth,(req,res)=>res.json(read(USERS_DB)));
app.get('/api/admin/wallets',adminAuth,(req,res)=>{
 let users=read(USERS_DB); let total={BTC:0,ETH:0,BNB:0,USDT_TRC20:0,USDT_BEP20:0,USDT_ERC20:0};
 users.forEach(u=>{ for(let k in total) total[k]+=(u.balances?.[k]||0); });
 res.json({total, users: users.map(u=>({phone:u.phone,name:u.name,balances:u.balances}))});
});
app.post('/api/admin/validate',adminAuth,(req,res)=>{
 let {id,status,amountToCredit}=req.body; if(!id||!status) return res.status(400).json({error:'manque'});
 let all=read(DB); let tx=all.find(t=>String(t.id)===String(id)); if(!tx) return res.status(404).json({error:'not found'});
 tx.status=status;
 if(tx.kind==='deposit' && status==='Validé - Payé' && amountToCredit){
   let users=read(USERS_DB); let u=users.find(x=>x.phone===tx.phonePay);
   if(u){ let amt=parseFloat(amountToCredit); if(amt>0){ u.balances[tx.crypto]=(u.balances[tx.crypto]||0)+amt; save(USERS_DB,users); tx.credited=amt; } }
 }
 if(tx.kind==='withdraw' && status==='Refusé'){
   let users=read(USERS_DB); let u=users.find(x=>x.phone===tx.phoneRec);
   if(u){ u.balances[tx.crypto]=(u.balances[tx.crypto]||0)+parseFloat(tx.cryptoAmount||0); save(USERS_DB,users); }
 }
 save(DB,all);
 // EMAIL quand validé
 if(status.includes('Validé') && tx.user?.email){
   sendEmail(tx.user.email, `Transaction ${tx.id} Validée ✅ - ART ZEDMO`, `<div style="font-family:sans-serif;background:#070f1c;color:#fff;padding:20px"><h2 style="color:#00ff9d">Validée ✅</h2><p>ID ${tx.id} validée.</p></div>`);
 }
 res.json({ok:true});
});

// === MODIF 2: KYC EN ATTENTE + EMAIL CLIENT (admin doit valider) ===
app.post('/api/kyc/submit',(req,res)=>{
 try{
  let all=JSON.parse(fs.readFileSync(DB_KYC,'utf8'));
  let users=read(USERS_DB);
  let u=users.find(x=>String(x.phone)===String(req.body.userId||req.body.phone));
  let k={ id:String(Date.now()), userId:String(req.body.userId||req.body.phone||'inconnu').trim(), type:req.body.type||'CNI', numero:String(req.body.numero||'').trim(), recto:req.body.recto||'', verso:req.body.verso||'', status:'En attente ⏳', date:new Date().toISOString() };
  if(!k.numero) return res.status(400).json({error:'numero manquant'});
  all.push(k); fs.writeFileSync(DB_KYC,JSON.stringify(all,null,2));
  if(u?.email){
    sendEmail(u.email, `KYC En attente ⏳ - ART ZEDMO`, `<div style="font-family:sans-serif;background:#070f1c;color:#fff;padding:20px"><h2 style="color:#ffaa00">KYC en attente ⏳</h2><p>Bonjour ${u.name}, ton KYC ${k.type} ${k.numero} est en attente de validation.</p></div>`);
  }
  res.json({ok:true,kycId:k.id});
 }catch(e){res.status(500).json({error:e.message})}
});
app.get('/api/admin/kyc/list',adminAuth,(req,res)=>{ res.json(JSON.parse(fs.readFileSync(DB_KYC,'utf8'))); });
app.post('/api/admin/kyc/validate',adminAuth,(req,res)=>{
 let all=JSON.parse(fs.readFileSync(DB_KYC,'utf8')); let {id,status}=req.body;
 all=all.map(k=>String(k.id)===String(id)?{...k,status}:k); fs.writeFileSync(DB_KYC,JSON.stringify(all,null,2));
 if(status==='Validé'){ let users=read(USERS_DB); let target=all.find(k=>String(k.id)===String(id)); if(target){ let u=users.find(x=>String(x.phone)===String(target.userId)); if(u){ u.kycStatus='Validé'; save(USERS_DB,users); if(u.email){ sendEmail(u.email, `KYC Validé ✅ - ART ZEDMO`, `<div style="font-family:sans-serif;background:#070f1c;color:#fff;padding:20px"><h2 style="color:#00ff9d">KYC Validé ✅</h2><p>${u.name}, ton KYC est validé.</p></div>`); } } } }
 res.json({ok:true});
});
app.get('/api/kyc/status',(req,res)=>{
 let phone=String(req.query.phone||'').trim(); let all=JSON.parse(fs.readFileSync(DB_KYC,'utf8')); let last=all.filter(k=>String(k.userId)===phone).pop();
 res.json(last||{status:'Non vérifié'});
});
app.post('/api/otp/send',(req,res)=>{
 let key=String(req.body.email||req.body.phone||'').trim(); if(!key) return res.status(400).json({error:'email/phone manquant'});
 let code=Math.floor(100000+Math.random()*900000); let store=JSON.parse(fs.readFileSync(DB_OTP,'utf8'));
 store[key]={code,expire:Date.now()+300000}; fs.writeFileSync(DB_OTP,JSON.stringify(store,null,2));
 console.log('OTP '+key+' = '+code); res.json({ok:true,code,msg:'Test - code visible ici et dans logs Render'});
});
app.post('/api/otp/verify',(req,res)=>{
 let key=String(req.body.email||req.body.phone||'').trim(); let store=JSON.parse(fs.readFileSync(DB_OTP,'utf8')); let o=store[key];
 if(!o) return res.json({ok:false,msg:'Pas de code'}); if(Date.now()>o.expire){ delete store[key]; fs.writeFileSync(DB_OTP,JSON.stringify(store,null,2)); return res.json({ok:false,msg:'Expiré'}); }
 if(String(o.code)===String(req.body.code)){ delete store[key]; fs.writeFileSync(DB_OTP,JSON.stringify(store,null,2)); return res.json({ok:true}); }
 res.json({ok:false,msg:'Mauvais code'});
});
app.post('/api/2fa/setup',(req,res)=>{
 try{
  const speakeasy=require('speakeasy'); const qrcode=require('qrcode');
  let secret=speakeasy.generateSecret({name:'ART-ZEDMO:'+(req.body.userId||'client')});
  let users=read(USERS_DB); let u=users.find(x=>String(x.phone)===String(req.body.userId)); if(u){ u.google2fa=secret.base32; save(USERS_DB,users); }
  qrcode.toDataURL(secret.otpauth_url,(e,qr)=>{ res.json({ok:true,secret:secret.base32,qr,otpauth:secret.otpauth_url}); });
 }catch(e){ res.json({ok:false,msg:'Fais npm install speakeasy qrcode',error:e.message}) }
});
app.post('/api/2fa/verify',(req,res)=>{
 try{ const speakeasy=require('speakeasy'); let ok=speakeasy.totp.verify({secret:req.body.secret,encoding:'base32',token:req.body.token,window:1}); res.json({ok:!!ok}); }catch(e){ res.json({ok:false}) }
});
app.get('/api/contact/whatsapp',(req,res)=>{ let msg=req.query.msg||'Bonjour ART-ZEDMO, besoin d aide'; res.redirect(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`); });
app.get('/api/admin/whatsapp-client',(req,res)=>{
 let phone=String(req.query.phone||'').replace(/\D/g,''); if(phone.startsWith('01')) phone='229'+phone.slice(1); if(!phone.startsWith('229')) phone='229'+phone.slice(-8);
 let msg=req.query.msg||'Bonjour, c est ART-ZEDMO'; res.redirect(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
});
app.get('/api/stats/chart/:phone',(req,res)=>{
 let phone=String(req.params.phone).slice(-8); let all=read(DB); let list=all.filter(t=>String(t.phonePay||'').includes(phone)||String(t.phoneRec||'').includes(phone));
 let parMois={}; list.forEach(t=>{ let m=(t.date||'').slice(0,7); parMois[m]=(parMois[m]||0)+1; }); res.json({total:list.length,parMois,list});
});

app.listen(process.env.PORT||3000,()=>console.log('V10 WALLET SECURE '+ADMIN_KEY));
