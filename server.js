const express=require('express'),fs=require('fs'),path=require('path'),cors=require('cors');
const app=express();
app.use(cors());
app.use(express.json({limit:'20mb'}));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(__dirname));

const DB=path.join(__dirname,'transactions.json');
if(!fs.existsSync(DB)) fs.writeFileSync(DB,'[]');
function read(){try{return JSON.parse(fs.readFileSync(DB,'utf8'))}catch{return []}}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}

app.post('/api/transaction',(req,res)=>{
  let all=read();
  let tx={id:String(Date.now()),status:'En attente',date:new Date().toLocaleString(),...req.body};
  all.push(tx); save(all);
  res.json({ok:true,tx})
});

app.get('/api/admin/transactions',(req,res)=>res.json(read()));

app.get('/api/my-transactions',(req,res)=>{
  let phone=(req.query.phone||'').slice(-8);
  let all=read();
  if(!phone) return res.json(all);
  // FIX V9.3: filtre aussi phoneRec + user.phone
  res.json(all.filter(t=>
    String(t.phonePay||'').includes(phone) ||
    String(t.phoneRec||'').includes(phone) ||
    String(t.user?.phone||'').includes(phone)
  ));
});

app.post('/api/admin/validate',(req,res)=>{
  let {id,status}=req.body;
  let all=read();
  all=all.map(t=>String(t.id)===String(id)?{...t,status}:t);
  save(all);
  res.json({ok:true})
});

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('🚀 ART-ZEDMO V9.3 FINAL en ligne sur port '+PORT+' | /admin'));
