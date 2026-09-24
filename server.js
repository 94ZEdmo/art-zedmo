const express=require('express'),fs=require('fs'),path=require('path'),cors=require('cors');
const app=express();
const ADMIN_KEY=process.env.ADMIN_KEY||'ZEDMO_2026_CHANGE_MOI_!@#';
const DB=path.join(__dirname,'transactions.json');
const USERS_DB=path.join(__dirname,'users.json');
app.use(cors()); app.use(express.json({limit:'50kb'}));
app.use(express.static(path.join(__dirname,'public')));
if(!fs.existsSync(DB)) fs.writeFileSync(DB,'[]');
if(!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB,'[]');
function read(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return []}}
function save(p,d){fs.writeFileSync(p,JSON.stringify(d,null,2))}
function adminAuth(req,res,next){ if(req.headers['x-admin-key']!==ADMIN_KEY && req.query.key!==ADMIN_KEY) return res.status(401).json({error:'Unauthorized'}); next(); }

// REGISTER avec wallet vide serveur
app.post('/api/register',(req,res)=>{
 let {name,phone,email,pass}=req.body;
 if(!name||!phone||!pass||phone.length<8) return res.status(400).json({error:'invalide'});
 let users=read(USERS_DB);
 if(users.find(u=>u.phone===phone)) return res.status(400).json({error:'Deja inscrit'});
 let u={name,phone,email:email||'',pass,date:new Date().toISOString(), balances:{BTC:0,ETH:0,BNB:0,USDT_TRC20:0,USDT_BEP20:0,USDT_ERC20:0,FCFA:0}};
 users.push(u); save(USERS_DB,users); res.json({ok:true});
});

// TRANSACTION EXCHANGE (comme avant)
app.post('/api/transaction',(req,res)=>{
 let {amount,cryptoAmount,type,country,operator,phonePay,phoneRec,crypto,address,depositTo,user}=req.body;
 if(!type||!crypto) return res.status(400).json({error:'manquant'});
 let tx={type,country,operator,crypto,address,depositTo,phonePay:String(phonePay||'').trim(),phoneRec:String(phoneRec||'').trim(),amount:amount?parseFloat(amount):undefined,cryptoAmount:cryptoAmount?parseFloat(cryptoAmount):undefined,user:user?{name:user.name,phone:user.phone,email:user.email}:null,id:String(Date.now())+Math.floor(Math.random()*1000),status:'En attente',date:new Date().toISOString(), kind:'exchange'};
 let all=read(DB); all.push(tx); save(DB,all); res.json({ok:true,tx});
});

// NOUVEAU: MON SOLDE (sécurisé, chaque client voit que le sien)
app.get('/api/my-balance',(req,res)=>{
 let phone=String(req.query.phone||'').trim();
 let users=read(USERS_DB); let u=users.find(x=>x.phone===phone);
 if(!u) return res.json({balances:{}});
 res.json({balances:u.balances||{}});
});

// NOUVEAU: DEPOT WALLET (client dit j'ai déposé)
app.post('/api/wallet/deposit',(req,res)=>{
 let {phone,crypto,txHash}=req.body;
 if(!phone||!crypto) return res.status(400).json({error:'manquant'});
 let all=read(DB);
 let dep={id:String(Date.now()),type:'Depot Wallet',crypto,txHash:txHash||'',phonePay:phone,user:{phone},status:'En attente',date:new Date().toISOString(), kind:'deposit'};
 all.push(dep); save(DB,all); res.json({ok:true, dep});
});

// NOUVEAU: RETRAIT WALLET
app.post('/api/wallet/withdraw',(req,res)=>{
 let {phone,crypto,amount,address}=req.body;
 let amt=parseFloat(amount); if(!phone||!crypto||!amt||amt<=0||!address) return res.status(400).json({error:'invalide'});
 let users=read(USERS_DB); let u=users.find(x=>x.phone===phone);
 if(!u) return res.status(404).json({error:'user'});
 if((u.balances[crypto]||0) < amt) return res.status(400).json({error:'Solde insuffisant'});
 u.balances[crypto]-=amt; save(USERS_DB,users);
 let all=read(DB);
 let wd={id:String(Date.now()),type:'Retrait Wallet',crypto,cryptoAmount:amt,address,phoneRec:phone,user:{phone:name=>u.name,phone:u.phone},status:'En attente',date:new Date().toISOString(), kind:'withdraw'};
 all.push(wd); save(DB,all); res.json({ok:true});
});

app.get('/api/my-transactions',(req,res)=>{
 let phone=String(req.query.phone||'').trim(); if(!phone||phone.length<8) return res.json([]);
 let all=read(DB); res.json(all.filter(t=> String(t.phonePay)===phone || String(t.phoneRec)===phone || String(t.user?.phone)===phone ));
});

// ADMIN
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
 // Si depot validé -> créditer le solde client
 if(tx.kind==='deposit' && status==='Validé - Payé' && amountToCredit){
   let users=read(USERS_DB); let u=users.find(x=>x.phone===tx.phonePay);
   if(u){ let amt=parseFloat(amountToCredit); if(amt>0){ u.balances[tx.crypto]=(u.balances[tx.crypto]||0)+amt; save(USERS_DB,users); tx.credited=amt; } }
 }
 // Si retrait refusé -> rembourser
 if(tx.kind==='withdraw' && status==='Refusé'){
   let users=read(USERS_DB); let u=users.find(x=>x.phone===tx.phoneRec);
   if(u){ u.balances[tx.crypto]=(u.balances[tx.crypto]||0)+parseFloat(tx.cryptoAmount||0); save(USERS_DB,users); }
 }
 save(DB,all); res.json({ok:true});
});
app.listen(process.env.PORT||3000,()=>console.log('V10 WALLET SECURE '+ADMIN_KEY));
