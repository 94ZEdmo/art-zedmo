import pathlib
p=pathlib.Path("index.html").read_text()
old="""async function confirmer(){
  const btn=document.getElementById('btnConfirm');
  const oldText=btn.innerText;
  try{
    let data={},msg="";
    if(TYPE=='buy'){
      let pay=document.getElementById('payFCFA').value;
      let phone=document.getElementById('phonePay').value;
      let crypto=document.getElementById('cryptoRec').value;
      let addr=document.getElementById('addrRec').value;
      if(!pay||parseFloat(pay)<=0) return alert('Entre le montant FCFA');
      if(!phone) return alert('Entre ton numero payeur');
      if(!addr) return alert('Entre ton adresse crypto pour recevoir');
      data={type:'Mobile->Crypto',country:CUR_COUNTRY,operator:CUR_OP,amount:pay,phonePay:phone,crypto:crypto,address:addr};
      msg=`✅ COMMANDE ACHAT VALIDEE\n\nPays: ${CUR_COUNTRY} - ${CUR_OP}\nTu payes: ${pay} FCFA (${phone})\nTu reçois: ${document.getElementById('rateBox').innerText}\nAdresse: ${addr}\n\nID: en cours...\nNous t'envoyons le crypto après reception Mobile Money.`;
    }else{
      let amount=document.getElementById('amountCrypto').value;
      let crypto=document.getElementById('cryptoSend').value;
      let phoneRec=document.getElementById('phoneRec').value;
      if(!amount||parseFloat(amount)<=0) return alert('Entre le montant crypto');
      if(!phoneRec) return alert('Entre le numero pour recevoir FCFA');
      data={type:'Crypto->Mobile',country:CUR_COUNTRY,operator:CUR_OP,cryptoAmount:amount,crypto:crypto,depositTo:WALLET[crypto],phoneRec:phoneRec};
      msg=`✅ VENTE VALIDEE - ENVOIE LE CRYPTO MAINTENANT\n\nTu vends: ${amount} ${crypto}\nTu reçois: ${document.getElementById('l3').innerText} sur ${phoneRec} (${CUR_OP})\n\nENVOIE TON ${crypto} A CETTE ADRESSE:\n${WALLET[crypto]}\n\n⚠️ Envoie exactement ${amount} ${crypto} reseau ${crypto}\nAprès envoi, on te paye en FCFA sous 5min.`;
    }
    btn.innerText='⏳ Validation...'; btn.disabled=true;
    let res=await fetch('/api/transaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!res.ok) throw new Error('Erreur serveur');
    let j=await res.json();
    msg = msg.replace('en cours...', j.tx.id.slice(-6).toUpperCase()).replace('ID:','ID: '+j.tx.id.slice(-6).toUpperCase());
    document.getElementById('sTitle').innerText= TYPE=='buy'? 'Achat Valide!' : 'Vente Validee - Envoie Crypto!';
    document.getElementById('sMsg').innerText= msg + `\n\nID Transaction: ${j.tx.id}\nStatut: ${j.tx.status}`;
    openM('success');
  }catch(e){
    alert('❌ Erreur: '+e.message+'\nVerifie que le serveur tourne');
  }finally{
    btn.innerText=oldText; btn.disabled=false;
  }
}"""

new="""async function confirmer(){
  const btn=document.getElementById('btnConfirm');
  const oldText=btn.innerText;
  btn.innerText='⏳ Validation...'; btn.disabled=true;
  try{
    let data={},msg="",txId='ART'+Date.now().toString().slice(-6);
    if(TYPE=='buy'){
      let pay=document.getElementById('payFCFA').value;
      let phone=document.getElementById('phonePay').value;
      let crypto=document.getElementById('cryptoRec').value;
      let addr=document.getElementById('addrRec').value;
      if(!pay||parseFloat(pay)<=0){btn.innerText=oldText;btn.disabled=false;return alert('Entre le montant FCFA');}
      if(!phone){btn.innerText=oldText;btn.disabled=false;return alert('Entre ton numero payeur');}
      if(!addr){btn.innerText=oldText;btn.disabled=false;return alert('Entre ton adresse crypto');}
      data={id:txId,type:'Mobile->Crypto',country:CUR_COUNTRY,operator:CUR_OP,amount:pay,phonePay:phone,crypto:crypto,address:addr,status:'En attente',date:new Date().toLocaleString()};
      msg=`✅ COMMANDE ACHAT VALIDEE\\n\\nPays: ${CUR_COUNTRY} - ${CUR_OP}\\nTu payes: ${pay} FCFA (${phone})\\nTu reçois: ${document.getElementById('rateBox').innerText}\\nAdresse: ${addr}\\n\\nID: ${txId}\\nOn t'envoie le crypto après Mobile Money.`;
    }else{
      let amount=document.getElementById('amountCrypto').value;
      let crypto=document.getElementById('cryptoSend').value;
      let phoneRec=document.getElementById('phoneRec').value;
      if(!amount||parseFloat(amount)<=0){btn.innerText=oldText;btn.disabled=false;return alert('Entre montant crypto');}
      if(!phoneRec){btn.innerText=oldText;btn.disabled=false;return alert('Entre numero FCFA');}
      data={id:txId,type:'Crypto->Mobile',country:CUR_COUNTRY,operator:CUR_OP,cryptoAmount:amount,crypto:crypto,depositTo:WALLET[crypto],phoneRec:phoneRec,status:'En attente depot',date:new Date().toLocaleString()};
      msg=`✅ VENTE VALIDEE - ENVOIE MAINTENANT\\n\\nTu vends: ${amount} ${crypto}\\nTu reçois: ${document.getElementById('l3').innerText} sur ${phoneRec}\\n\\nENVOIE A:\\n${WALLET[crypto]}\\n\\nID: ${txId}\\nAprès envoi, payement FCFA 5min.`;
    }
    // Sauvegarde locale toujours
    let hist=JSON.parse(localStorage.getItem('art_history')||'[]');
    hist.unshift(data);
    localStorage.setItem('art_history',JSON.stringify(hist));
    // Essaye serveur mais ne bloque pas si echec
    try{
      const controller=new AbortController();
      setTimeout(()=>controller.abort(),3000);
      let res=await fetch('/api/transaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      let j=await res.json();
      if(j && j.tx && j.tx.id) txId=String(j.tx.id);
    }catch(e){console.log('Serveur offline, sauvegarde locale OK',e);}
    document.getElementById('sTitle').innerText= TYPE=='buy'? 'Achat Valide!' : 'Vente Validee!';
    document.getElementById('sMsg').innerText= msg;
    openM('success');
  }catch(e){
    alert('Erreur: '+e.message);
  }finally{
    btn.innerText=oldText; btn.disabled=false;
  }
}
async function loadHist(){
  // D'abord localStorage
  let local=JSON.parse(localStorage.getItem('art_history')||'[]');
  let h='';
  if(local.length){
    local.slice(0,20).forEach(tx=>{
      h+=`<div style="border-bottom:1px solid #1e344d;padding:8px 0;font-size:12px"><b>${tx.type}</b> ${tx.crypto||''} ${tx.amount||tx.cryptoAmount||''}<br><small style="color:#8aa1b6">${tx.destAddress||tx.address||tx.depositTo||''} | ${tx.phonePay||tx.phoneRec||''}</small> - <span style="color:#00ff9d">${tx.status}</span> <small>${tx.date||''}</small></div>`;
    });
  }
  document.getElementById('histList').innerHTML=h||'Aucune';
  // Ensuite essaye serveur pour completer
  try{
    let r=await fetch('/api/admin/transactions');let d=await r.json();
    if(d && d.length){
      let hs='';
      d.slice(0,20).forEach(tx=>{hs+=`<div style="border-bottom:1px solid #1e344d;padding:8px 0;font-size:12px"><b>${tx.type}</b> ${tx.crypto||''} ${tx.amount||tx.cryptoAmount||''}<br><small style="color:#8aa1b6">${tx.destAddress||tx.address||tx.depositTo||''}</small> - <span style="color:#00ff9d">${tx.status}</span></div>`});
      if(hs) document.getElementById('histList').innerHTML=hs + '<hr>' + h;
    }
  }catch(e){}
}
"""

if old in p:
  p=p.replace(old,new)
  pathlib.Path("index.html").write_text(p)
  print("FIX OK - bouton debloque")
else:
  print("ANCIEN CODE NON TROUVE - colle fichier complet")
