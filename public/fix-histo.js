async function chargerHisto(){
  try{
    let r = await fetch('/api/admin/transactions');
    let all = await r.json();
    let box = document.querySelector('#histo-box') || document.getElementById('historique') || document.querySelector('[class*=Historique]') || document.body;
    // cherche le conteneur de la liste
    let list = document.querySelector('.history-list') || document.getElementById('historyList') || document.querySelector('div:has(> div)');
    let html = all.slice().reverse().map(t=>`
      <div style="background:#111827;padding:12px;margin:8px 0;border-radius:12px;border-left:3px solid ${t.status.includes('Validé')?'#00ff88':'orange'}">
        <b>${t.type||'Mobile->Crypto'} ${t.crypto||''} ${t.amount||''} FCFA</b><br>
        <small style="opacity:0.7;word-break:break-all">${t.address||t.id}</small><br>
        <small style="color:${t.status.includes('Validé')?'#00ff88':'orange'}">${t.status} - ${t.date||''}</small>
      </div>
    `).join('');
    // injecte dans la page historique
    let cible = document.getElementById('historiqueContainer') || document.querySelector('#app') || document.body;
    let el = document.getElementById('MON_HISTO_FIXE');
    if(!el){
      el = document.createElement('div');
      el.id='MON_HISTO_FIXE';
      (document.querySelector('main')||document.body).appendChild(el);
    }
    el.innerHTML = html || '<p style="text-align:center;opacity:0.5">Aucune transaction</p>';
    // Si tu as une fonction d'origine, on l'écrase
    window.afficherHistorique = chargerHisto;
    window.loadHistory = chargerHisto;
  }catch(e){console.log('histo err',e)}
}
setInterval(chargerHisto,2000);
setTimeout(chargerHisto,500);
document.addEventListener('click',e=>{
  if(e.target.innerText && e.target.innerText.toLowerCase().includes('historique')) setTimeout(chargerHisto,300);
});
