const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

// --- CONFIG ---
const ADMIN_KEY = process.env.ADMIN_KEY || 'ZEDMO_2026_CHANGE_MOI_!@#';
const DB = path.join(__dirname, 'transactions.json');
const USERS_DB = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json({limit:'50kb'})); // 20mb -> trop gros
app.use(express.static(path.join(__dirname, 'public'))); // SEULEMENT public
// SUPPRIMÉ: app.use(express.static(__dirname)) -> Faille critique

if(!fs.existsSync(DB)) fs.writeFileSync(DB,'[]');
if(!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB,'[]');

function read(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return []}}
function save(p,d){fs.writeFileSync(p,JSON.stringify(d,null,2))}

// Middleware admin
function adminAuth(req,res,next){
  if(req.headers['x-admin-key'] !== ADMIN_KEY && req.query.key !== ADMIN_KEY){
    return res.status(401).json({error:'Unauthorized'});
  }
  next();
}

// --- API CLIENT ---

// 1. Inscription (manquait)
app.post('/api/register',(req,res)=>{
  let {name,phone,email,pass} = req.body;
  if(!name || !phone || !pass || phone.length < 8) return res.status(400).json({error:'Champs invalides'});
  let users = read(USERS_DB);
  if(users.find(u=>u.phone===phone)) return res.status(400).json({error:'Deja inscrit'});
  let u = {name,phone,email:email||'',pass, date:new Date().toISOString()};
  users.push(u); save(USERS_DB,users);
  res.json({ok:true});
});

// 2. Transaction SECURISEE
app.post('/api/transaction',(req,res)=>{
  let {amount, cryptoAmount, type, country, operator, phonePay, phoneRec, crypto, address, depositTo, user} = req.body;
  
  // Validation
  if(!type || !crypto) return res.status(400).json({error:'Type/crypto manquant'});
  let numAmount = parseFloat(amount || cryptoAmount || 0);
  if(numAmount <=0) return res.status(400).json({error:'Montant invalide'});

  // CORRECTION CRITIQUE: on force id/status APRES le body, pas avant
  let tx = {
    type, country, operator, crypto, address, depositTo,
    phonePay: (phonePay||'').trim(),
    phoneRec: (phoneRec||'').trim(),
    amount: amount ? parseFloat(amount) : undefined,
    cryptoAmount: cryptoAmount ? parseFloat(cryptoAmount) : undefined,
    user: user ? {name:user.name, phone:user.phone, email:user.email} : null, // on ne stocke pas le pass
    id: String(Date.now()) + Math.floor(Math.random()*1000),
    status: 'En attente',
    date: new Date().toISOString()
  };
  
  let all = read(DB); all.push(tx); save(DB,all);
  res.json({ok:true, tx});
});

// 3. Historique SECURISE - match exact, plus includes()
app.get('/api/my-transactions',(req,res)=>{
  let phone = String(req.query.phone||'').trim();
  if(!phone || phone.length < 8) return res.json([]);
  let all = read(DB);
  res.json(all.filter(t=> 
    String(t.phonePay) === phone || 
    String(t.phoneRec) === phone || 
    String(t.user?.phone) === phone
  ));
});

// --- API ADMIN PROTEGE ---

app.get('/api/admin/transactions', adminAuth, (req,res)=>res.json(read(DB)));
app.get('/api/admin/users', adminAuth, (req,res)=>res.json(read(USERS_DB)));

app.post('/api/admin/validate', adminAuth, (req,res)=>{
  let {id,status} = req.body;
  if(!id || !status) return res.status(400).json({error:'manque id/status'});
  if(!['Validé - Payé','Refusé','En attente'].includes(status)) return res.status(400).json({error:'status invalide'});
  let all = read(DB);
  all = all.map(t=> String(t.id)===String(id) ? {...t,status} : t);
  save(DB,all);
  res.json({ok:true});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log('🚀 ART-ZEDMO V9.7 SECURE port '+PORT+' | Admin key: '+ADMIN_KEY));
