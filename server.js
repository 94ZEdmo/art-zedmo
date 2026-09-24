const express=require('express'),fs=require('fs'),path=require('path'),cors=require('cors');
const app=express();
app.use(cors()); app.use(express.json({limit:'20mb'}));
app.use(express.static(__dirname));

const DB_TX=path.join(__dirname,'transactions.json');
const DB_USERS=path.join(__dirname,'users.json');
if(!fs.existsSync(DB_TX)) fs.writeFileSync(DB_TX,'[]');
if(!fs.existsSync(DB_USERS)) fs.writeFileSync(DB_USERS,'[]');
function read(f){try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return []}}
function save(f,d){fs.writeFileSync(f,JSON.stringify(d,null,2))}

// INSCRIPTION CLIENT - FIX pour afficher tous les inscrits
app.post('/api/register',(req,res)=>{
  let users=read(DB_USERS);
  let {name,phone,pass}=req.body;
  if(!users.find(u=>u.phone===phone)){
    users.push({name,phone,pass,date:new Date().toLocaleString()});
    save(DB_USERS,users);
  }
  res.json({ok:true});
});

app.post('/api/transaction',(req,res)=>{
  let all=read(DB_TX);
  let tx={id:String(Date.now()),status:'En attente',date:new Date().toLocaleString(),...req.body};
  all.push(tx); save(DB_TX,all);
  res.json({ok:true,tx});
});

app.get('/api/admin/transactions',(req,res)=>res.json(read(DB_TX)));
app.get('/api/admin/users',(req,res)=>res.json(read(DB_USERS)));

app.get('/api/my-transactions',(req,res)=>{
  let phone=(req.query.phone||'').slice(-8);
  let all=read(DB_TX);
  if(!phone) return res.json(all);
  res.json(all.filter(t=> String(t.phonePay||'').includes(phone) || String(t.phoneRec||'').includes(phone) || String(t.user?.phone||'').includes(phone)));
});

app.post('/api/admin/validate',(req,res)=>{
  let {id,status}=req.body; let all=read(DB_TX);
  all=all.map(t=>String(t.id)===String(id)?{...t,status}:t);
  save(DB_TX,all); res.json({ok:true});
});

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('🚀 ART-ZEDMO V9.4 FIX sur '+PORT));
