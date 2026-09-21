import pathlib
p=pathlib.Path("index.html").read_text()
p=p.replace(
"""function calcBuy(){let p=parseFloat(document.getElementById('payFCFA').value)||0;let cr=document.getElementById('cryptoRec').value;let rate=RATES[cr];let f=p*0.02;let tot=p+f;let rec=p/rate;document.getElementById('l1').innerText=p.toLocaleString()+' FCFA';document.getElementById('l2').innerText=f.toLocaleString()+' FCFA';document.getElementById('l3').innerText=tot.toLocaleString()+' FCFA';document.getElementById('solde').innerText=tot.toLocaleString()+' FCFA';document.getElementById('rateBox').innerText=`Vous recevrez ${rec.toFixed(6)} ${cr} | 1 ${cr} = ${rate} FCFA`;}\nfunction calcSell(){let a=parseFloat(document.getElementById('amountCrypto').value)||0;let cr=document.getElementById('cryptoSend').value;let rate=RATES[cr];let total=a*rate;let f=total*0.02;let net=total-f;document.getElementById('l1').innerText=a+' '+cr;document.getElementById('l2').innerText=f.toLocaleString()+' FCFA';document.getElementById('l3').innerText=net.toLocaleString()+' FCFA';document.getElementById('rateBox').innerText=`Vous recevrez ${net.toLocaleString()} FCFA`;}""",
"""function calcBuy(){
 if(TYPE!='buy') return;
 let pay=parseFloat(document.getElementById('payFCFA').value)||0;
 let cr=document.getElementById('cryptoRec').value;
 let rate=RATES[cr];
 let frais=pay*0.02;
 let total=pay+frais;
 let rec=pay/rate;
 document.getElementById('l1').innerText=pay.toLocaleString()+' FCFA';
 document.getElementById('l2').innerText=frais.toLocaleString()+' FCFA';
 document.getElementById('l3').innerText=total.toLocaleString()+' FCFA';
 document.getElementById('solde').innerText=total.toLocaleString()+' FCFA';
 document.getElementById('rateBox').innerText=`Vous recevrez ${rec.toFixed(6)} ${cr} | 1 ${cr} = ${rate} FCFA`;
}
function calcSell(){
 if(TYPE!='sell') return;
 let a=parseFloat(document.getElementById('amountCrypto').value)||0;
 let cr=document.getElementById('cryptoSend').value;
 let rate=RATES[cr];
 let total=a*rate;
 let f=total*0.02;
 let net=total-f;
 document.getElementById('l1').innerText=a+' '+cr;
 document.getElementById('l2').innerText=f.toLocaleString()+' FCFA';
 document.getElementById('l3').innerText=net.toLocaleString()+' FCFA';
 document.getElementById('rateBox').innerText=`Vous recevrez ${net.toLocaleString()} FCFA sur Mobile Money`;
}"""
)
pathlib.Path("index.html").write_text(p)
print("CORRIGE ACHAT/VENTE")
