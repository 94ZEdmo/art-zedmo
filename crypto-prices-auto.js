const ZEDMO_CRYPTO = {
  nom: "TOUNKA ZAKARI Moussiliou",
  mtn: "0196587303",
  moov: "0194655238",
  minimums: { BEP20: 5, TRC20: 10, ERC20: 20 },
  frais: { BEP20: 0.1, TRC20: 1, ERC20: 3.5 },
  marge: 0.02
};
async function getPrixZedmo() {
  try{
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const d = await r.json();
    const taux = d.rates.XOF;
    return {
      taux: taux,
      BEP20: (taux * 1.02 * 1.01).toFixed(2),
      TRC20: (taux * 1.02 * 1.03).toFixed(2),
      ERC20: (taux * 1.02 * 1.08).toFixed(2),
      achat: (taux * 0.98).toFixed(2)
    };
  }catch(e){ return { taux:605, BEP20:623, TRC20:636, ERC20:666, achat:593 } }
}
