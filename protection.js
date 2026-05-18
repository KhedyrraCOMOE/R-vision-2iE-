// ═══════════════════════════════════════════════════════════
//  SYSTÈME DE PROTECTION FIREBASE — Hub Révision 2iE
//  À inclure dans chaque module avec :
//  <script src="protection.js"></script>
// ═══════════════════════════════════════════════════════════

(function() {
  const FIREBASE_API_KEY    = "AIzaSyDDs37KgcNMqa8RdR7Ost7jg8qMBJmm3Yg";
  const FIREBASE_PROJECT_ID = "hub-revision-2ie";
  const SESSION_KEY         = "hub2ie_session";
  const SESSION_HOURS       = 12;
  const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  function getCle() { const d=new Date(); return `code_${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,'0')}`; }
  function getMoisLabel() { const d=new Date(); return `${MOIS[d.getMonth()]} ${d.getFullYear()}`; }
  function sessionValide() { try { const s=JSON.parse(localStorage.getItem(SESSION_KEY)||"{}"); return s.expiry&&Date.now()<s.expiry; } catch { return false; } }
  function sauvegarderSession() { localStorage.setItem(SESSION_KEY, JSON.stringify({expiry: Date.now()+SESSION_HOURS*3600*1000})); }

  // Injecter le CSS
  const style = document.createElement('style');
  style.textContent = `
    #hub-protection-overlay{position:fixed;inset:0;z-index:99999;background:#0a0f1e;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',system-ui,sans-serif}
    #hub-protection-overlay.hidden{display:none}
    .hub-lock-card{background:#111827;border:1px solid #1e3a5f;border-radius:20px;padding:40px 36px;width:90%;max-width:420px;text-align:center;box-shadow:0 0 60px rgba(59,130,246,.15)}
    .hub-lock-logo{font-size:48px;margin-bottom:8px}
    .hub-lock-title{color:#e2e8f0;font-size:22px;font-weight:700;margin:0 0 4px}
    .hub-lock-subtitle{color:#64748b;font-size:13px;margin:0 0 28px}
    .hub-lock-badge{display:inline-block;background:#1e3a5f;color:#60a5fa;font-size:11px;padding:3px 10px;border-radius:99px;margin-bottom:20px}
    .hub-lock-input{width:100%;padding:14px 16px;background:#1e293b;border:2px solid #334155;border-radius:12px;color:#f1f5f9;font-size:20px;letter-spacing:4px;text-align:center;outline:none;transition:border-color .2s;box-sizing:border-box;margin-bottom:12px}
    .hub-lock-input:focus{border-color:#3b82f6}
    .hub-lock-input.error{border-color:#ef4444;animation:hubShake .4s ease}
    @keyframes hubShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
    .hub-lock-btn{width:100%;padding:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;font-size:16px;font-weight:600;border:none;border-radius:12px;cursor:pointer;margin-bottom:12px}
    .hub-lock-msg{font-size:13px;min-height:20px;margin-bottom:8px}
    .hub-lock-msg.error{color:#ef4444}
    .hub-lock-msg.loading{color:#64748b}
    .hub-lock-msg.success{color:#22c55e}
    .hub-lock-footer{color:#334155;font-size:11px;margin-top:16px;border-top:1px solid #1e293b;padding-top:14px}
  `;
  document.head.appendChild(style);

  // Injecter le HTML
  const overlay = document.createElement('div');
  overlay.id = 'hub-protection-overlay';
  overlay.innerHTML = `
    <div class="hub-lock-card">
      <div class="hub-lock-logo">🔐</div>
      <h1 class="hub-lock-title">Hub Révision 2iE</h1>
      <p class="hub-lock-subtitle">BGIS · Cohorte Février 2026</p>
      <div class="hub-lock-badge">Mois : ${getMoisLabel()}</div>
      <input type="text" id="hub-lock-input" class="hub-lock-input" placeholder="CODE DU MOIS" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false"/>
      <button class="hub-lock-btn" id="hub-lock-btn">Déverrouiller →</button>
      <div class="hub-lock-msg" id="hub-lock-msg"></div>
      <div class="hub-lock-footer">Code reçu par Khedyrra via WhatsApp/SMS<br>Connexion internet requise</div>
    </div>
  `;

  // Si session valide → pas d'overlay
  if (sessionValide()) return;

  document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const input = document.getElementById('hub-lock-input');
    const btn   = document.getElementById('hub-lock-btn');
    const msg   = document.getElementById('hub-lock-msg');

    input.addEventListener('keydown', e => { if (e.key === 'Enter') verifier(); });
    btn.addEventListener('click', verifier);

    async function verifier() {
      const saisi = input.value.trim().toUpperCase();
      if (!saisi) { affMsg('error','Entre le code reçu.'); return; }
      btn.disabled = true;
      affMsg('loading','⏳ Vérification…');
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/codes/${getCle()}?key=${FIREBASE_API_KEY}`;
        const resp = await fetch(url);
        if (!resp.ok) { affMsg('error', resp.status===404 ? '❌ Aucun code ce mois-ci.' : '❌ Erreur connexion.'); btn.disabled=false; return; }
        const data = await resp.json();
        const code = (data?.fields?.valeur?.stringValue||'').toUpperCase();
        if (saisi === code) {
          affMsg('success','✅ Accès accordé !');
          sauvegarderSession();
          setTimeout(() => { overlay.classList.add('hidden'); document.body.style.overflow=''; }, 700);
        } else {
          input.classList.add('error');
          setTimeout(() => input.classList.remove('error'), 500);
          affMsg('error','❌ Code incorrect.');
          btn.disabled = false;
        }
      } catch {
        affMsg('error','❌ Pas de connexion internet.');
        btn.disabled = false;
      }
    }

    function affMsg(type, texte) { msg.className='hub-lock-msg '+type; msg.textContent=texte; }
  });

})();
