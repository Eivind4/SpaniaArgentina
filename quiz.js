import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue, update } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCwnU6ZEYUTrKCc0Afru7JPjvRif-g_gbA",
  authDomain: "norgeelfenbenkysten.firebaseapp.com",
  databaseURL: "https://norgeelfenbenkysten-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "norgeelfenbenkysten",
  storageBucket: "norgeelfenbenkysten.firebasestorage.app",
  messagingSenderId: "950269622806",
  appId: "1:950269622806:web:97e5ce88e223f783fc5337"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

var DEADLINE = new Date('2026-07-19T21:00:00');
function isLocked() { return new Date() >= DEADLINE; }
function pad(n) { return String(n).padStart(2,'0'); }

function applyLockState() {
  var locked = isLocked();
  var lb = document.getElementById('lockBanner');
  var cd = document.getElementById('countdownBox');
  var btn = document.getElementById('submitBtn');
  if (lb) lb.style.display = locked ? 'block' : 'none';
  if (cd) cd.style.display = locked ? 'none' : 'block';
  if (btn) btn.disabled = locked;
}

function tickCd() {
  var diff = DEADLINE - new Date();
  if (diff <= 0) { applyLockState(); return; }
  var d = Math.floor(diff/86400000);
  var h = Math.floor((diff%86400000)/3600000);
  var m = Math.floor((diff%3600000)/60000);
  var s = Math.floor((diff%60000)/1000);
  var e = function(id) { return document.getElementById(id); };
  if (e('cd-d')) e('cd-d').textContent = pad(d);
  if (e('cd-h')) e('cd-h').textContent = pad(h);
  if (e('cd-m')) e('cd-m').textContent = pad(m);
  if (e('cd-s')) e('cd-s').textContent = pad(s);
  setTimeout(tickCd, 1000);
}
tickCd();
applyLockState();

onValue(ref(db, 'spain_entries'), function(snap) {
  var count = snap.exists() ? snap.size : 0;
  var el = document.getElementById('fbStatus');
  if (el) el.innerHTML = 'Firebase koplet - ' + count + ' deltakere';
});

// State - numeric questions
var sc = {
  q_res_esp:0, q_res_arg:0,
  q_half:0, q_yellow:0,
  q_passes_esp:0, q_passes_arg:0,
  q_corners:0, q_shots:0, q_free:0,
  a_res_esp:0, a_res_arg:0,
  a_half:0, a_yellow:0,
  a_passes_esp:0, a_passes_arg:0,
  a_corners:0, a_shots:0, a_free:0
};
var opts = {};
var selAvatar = null;
var selEmoji = '';
var selTeam = null;
var avNames = {
  yamal:'Yamal #19', rodri:'Rodri #16', pedri:'Pedri #8', williams:'N.Williams #17',
  carvajal:'Carvajal #2', laporte:'Laporte #14', fabianruiz:'Fabian Ruiz #6', oyarzabal:'Oyarzabal #11',
  messi:'Messi #10', martinez:'E.Martinez', alvarez:'J.Alvarez #9',
  macallister:'MacAllister #5', lmartinez:'L.Martinez #22',
  depaul:'De Paul #7', molina:'Molina #26', tagliafico:'Tagliafico #3'
};

// Bool question keys
var boolQs = ['q_cable','q_trump','q_dance','q_var','q_var_goal','q_pen',
               'q_argleg','q_espleg','q_messi','q_yamal','q_yamal_bro','q_1966',
               'q_throwin','q_turnaro','q_otgoal','q_subgoal'];

window.showTab = function(t) {
  document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
  document.querySelectorAll('.pane').forEach(function(x){ x.classList.remove('active'); });
  document.getElementById('tab-'+t).classList.add('active');
  document.getElementById('pane-'+t).classList.add('active');
};

window.selAv = function(btn) {
  document.querySelectorAll('.av-btn').forEach(function(b){ b.classList.remove('sel'); });
  btn.classList.add('sel');
  selAvatar = btn.dataset.av;
  selEmoji = btn.dataset.emoji;
};

window.selOpt = function(qid, btn, val) {
  document.querySelectorAll('#'+qid+' .opt').forEach(function(b){ b.classList.remove('sel'); });
  btn.classList.add('sel');
  opts[qid] = val;
};

window.adjSc = function(k, d) {
  var min = 0; var max = (k.indexOf('passes') >= 0) ? 1500 : 500;
  sc[k] = Math.max(min, Math.min(max, (sc[k]||0)+d));
  var el = document.getElementById(k+'-val');
  if (!el) return;
  if (el.tagName === 'INPUT') el.value = sc[k]; else el.textContent = sc[k];
};

window.adjScSpan = function(k, d) {
  sc[k] = Math.max(0, Math.min(20, (sc[k]||0)+d));
  var el = document.getElementById(k+'-val');
  if (el) el.textContent = sc[k];
};

window.syncInput = function(k) {
  var el = document.getElementById(k+'-val');
  if (!el) return;
  var v = parseInt(el.value);
  var max = (k.indexOf('passes') >= 0) ? 1500 : 500;
  if (isNaN(v)||v<0) v=0;
  if (v>max) v=max;
  sc[k]=v; el.value=v;
};

// Team handling
window.onTeamChange = function(sel) {
  if (sel.value === '__new__') {
    document.getElementById('newTeamWrap').style.display = 'flex';
    selTeam = null;
  } else {
    document.getElementById('newTeamWrap').style.display = 'none';
    selTeam = sel.value || null;
    document.getElementById('teamConfirmed').textContent = selTeam ? 'Lag: '+selTeam : '';
  }
};

window.confirmNewTeam = function() {
  var name = document.getElementById('newTeamName').value.trim();
  if (!name) { alert('Skriv inn lagnavn!'); return; }
  selTeam = name;
  var sel = document.getElementById('teamSelect');
  var existing = Array.from(sel.options).find(function(o){ return o.value===name; });
  if (!existing) {
    var opt = document.createElement('option');
    opt.value = name; opt.textContent = 'Lag: '+name;
    sel.insertBefore(opt, sel.querySelector('[value="__new__"]'));
  }
  sel.value = name;
  document.getElementById('newTeamWrap').style.display = 'none';
  document.getElementById('teamConfirmed').textContent = 'Lag: '+name;
};

onValue(ref(db, 'spain_teams'), function(snap) {
  var sel = document.getElementById('teamSelect');
  if (!sel||!snap.exists()) return;
  var current = sel.value;
  while (sel.options.length > 2) sel.remove(1);
  var teams = [];
  snap.forEach(function(c){ teams.push(c.val()); });
  teams.sort();
  var newOpt = sel.querySelector('[value="__new__"]');
  teams.forEach(function(t) {
    var opt = document.createElement('option');
    opt.value=t; opt.textContent='Lag: '+t;
    sel.insertBefore(opt, newOpt);
  });
  if (current) sel.value = current;
});

window.toggleFasit = function() {
  var card = document.getElementById('fasitCard');
  var btn = document.getElementById('editFasitBtn');
  if (!card) return;
  var vis = card.style.display !== 'none';
  card.style.display = vis ? 'none' : 'block';
  btn.textContent = vis ? 'REGISTRER / ENDRE FASIT' : 'SKJUL FASIT';
};

window.submitEntry = async function() {
  if (isLocked()) { alert('Beklager - registreringsfristen er passert!'); return; }
  var name = document.getElementById('playerName').value.trim();
  if (!name) { alert('Skriv inn navn forst!'); return; }
  if (!selAvatar) { alert('Velg en spiller!'); return; }
  if (!opts.q_winner) { alert('Hvem tror du vinner finalen?'); return; }

  ['q_half','q_yellow','q_passes_esp','q_passes_arg','q_corners','q_shots','q_free'].forEach(function(k){ window.syncInput(k); });

  var nameKey = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
  try {
    var existing = await get(ref(db, 'spain_entries/'+nameKey));
    if (existing.exists()) {
      if (!confirm(name+' er allerede registrert! Vil du overskrive?')) return;
    }
    if (selTeam) {
      var teamKey = selTeam.toLowerCase().replace(/[^a-z0-9]/g,'_');
      await set(ref(db, 'spain_teams/'+teamKey), selTeam);
    }
    var entry = {
      name:name, avatar:selAvatar, emoji:selEmoji, team:selTeam||'',
      q_winner:opts.q_winner||'',
      q_cable:opts.q_cable||'', q_trump:opts.q_trump||'', q_dance:opts.q_dance||'',
      q_var:opts.q_var||'', q_pen:opts.q_pen||'',
      q_argleg:opts.q_argleg||'', q_espleg:opts.q_espleg||'',
      q_var_goal:opts.q_var_goal||'',
      q_messi:opts.q_messi||'', q_yamal:opts.q_yamal||'',
      q_yamal_bro:opts.q_yamal_bro||'', q_1966:opts.q_1966||'',
      q_throwin:opts.q_throwin||'', q_otgoal:opts.q_otgoal||'', q_subgoal:opts.q_subgoal||'',
      q_red:opts.q_red||'', q_turnaro:opts.q_turnaro||'',
      q_passacc:opts.q_passacc||'',
      q_res:sc.q_res_esp+'-'+sc.q_res_arg,
      q_half:sc.q_half, q_yellow:sc.q_yellow,
      q_passes_esp:sc.q_passes_esp, q_passes_arg:sc.q_passes_arg,
      q_corners:sc.q_corners, q_shots:sc.q_shots, q_free:sc.q_free,
      q_min:document.getElementById('q_min').value||'',
      pts:0, ts:Date.now()
    };
    await set(ref(db,'spain_entries/'+nameKey), entry);
    document.getElementById('successEmoji').textContent = selEmoji;
    document.getElementById('successName').textContent = name.toUpperCase()+' ER MED!';
    document.getElementById('successSub').textContent = avNames[selAvatar]+(selTeam?' - Lag: '+selTeam:'')+' - Lykke til!';
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('successBox').style.display = 'block';
  } catch(err) { alert('Feil: '+err.message); }
};

window.resetForm = function() {
  document.getElementById('playerName').value='';
  document.querySelectorAll('.av-btn').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('.opt').forEach(function(b){ b.classList.remove('sel'); });
  selAvatar=null; selEmoji=''; selTeam=null;
  Object.keys(sc).forEach(function(k){
    if (!k.startsWith('a_')) {
      sc[k]=0;
      var el=document.getElementById(k+'-val');
      if(el){ if(el.tagName==='INPUT') el.value='0'; else el.textContent='0'; }
    }
  });
  document.getElementById('q_min').value='';
  document.getElementById('teamSelect').value='';
  document.getElementById('teamConfirmed').textContent='';
  document.getElementById('newTeamWrap').style.display='none';
  document.getElementById('successBox').style.display='none';
  document.getElementById('submitBtn').style.display='block';
};

function pctScore(guess, actual, max) {
  if (isNaN(guess)||isNaN(actual)) return 0;
  if (actual===0) return guess===0?max:0;
  return Math.round(Math.max(0,1-Math.abs(guess-actual)/actual)*max*10)/10;
}

window.calcAndSaveScores = async function() {
  ['a_half','a_yellow','a_passes_esp','a_passes_arg','a_corners','a_shots','a_free'].forEach(function(k){ window.syncInput(k); });

  var ans = {
    q_winner:opts.a_winner||'',
    q_cable:opts.a_cable||'', q_trump:opts.a_trump||'', q_dance:opts.a_dance||'',
    q_var:opts.a_var||'', q_pen:opts.a_pen||'',
    q_argleg:opts.a_argleg||'', q_espleg:opts.a_espleg||'',
    q_var_goal:opts.a_var_goal||'',
    q_messi:opts.a_messi||'', q_yamal:opts.a_yamal||'',
    q_yamal_bro:opts.a_yamal_bro||'', q_1966:opts.a_1966||'',
    q_throwin:opts.a_throwin||'', q_otgoal:opts.a_otgoal||'', q_subgoal:opts.a_subgoal||'',
    q_red:opts.a_red||'', q_turnaro:opts.a_turnaro||'',
    q_passacc:opts.a_passacc||'',
    q_res:sc.a_res_esp+'-'+sc.a_res_arg,
    q_half:sc.a_half, q_yellow:sc.a_yellow,
    q_passes_esp:sc.a_passes_esp, q_passes_arg:sc.a_passes_arg,
    q_corners:sc.a_corners, q_shots:sc.a_shots, q_free:sc.a_free,
    q_min:document.getElementById('a_min').value||''
  };
  await set(ref(db,'spain_answers'), ans);

  try {
    var snap = await get(ref(db,'spain_entries'));
    if (!snap.exists()) { alert('Ingen deltakere.'); return; }
    var updates = {};
    snap.forEach(function(child) {
      var e = child.val(); var p = 0;
      // 5pt winner
      if (ans.q_winner && e.q_winner===ans.q_winner) p+=5;
      // 1pt booleans
      boolQs.forEach(function(k){ if(ans[k]&&e[k]===ans[k]) p+=1; });
      // result 5/2
      if (ans.q_res && e.q_res===ans.q_res) {
        p+=5;
      } else if (ans.q_res) {
        var ag=ans.q_res.split('-'), eg=(e.q_res||'').split('-');
        if(ag.length===2&&eg.length===2&&(ag[0]===eg[0]||ag[1]===eg[1])) p+=2;
      }
      // 2pt numeric exact
      if(parseInt(e.q_half)===parseInt(ans.q_half)) p+=2;
      if(parseInt(e.q_yellow)===parseInt(ans.q_yellow)) p+=2;
      // 2pt red card
      if(ans.q_red&&e.q_red===ans.q_red) p+=2;
      // 2pt turnaro
      if(ans.q_turnaro&&e.q_turnaro===ans.q_turnaro) p+=2;
      // 2pt passacc
      if(ans.q_passacc&&e.q_passacc===ans.q_passacc) p+=2;
      // 3pt first goal minute
      if(ans.q_min&&e.q_min&&e.q_min===ans.q_min) p+=3;
      // pct 0-5
      p+=pctScore(parseInt(e.q_passes_esp),parseInt(ans.q_passes_esp),5);
      p+=pctScore(parseInt(e.q_passes_arg),parseInt(ans.q_passes_arg),5);
      p+=pctScore(parseInt(e.q_corners),parseInt(ans.q_corners),5);
      p+=pctScore(parseInt(e.q_shots),parseInt(ans.q_shots),5);
      p+=pctScore(parseInt(e.q_free),parseInt(ans.q_free),5);
      updates['spain_entries/'+child.key+'/pts'] = Math.round(p*10)/10;
    });
    await update(ref(db), updates);
    alert('Poeng oppdatert!');
    showResultAnimation(ans.q_res, ans.q_winner);
  } catch(err) { alert('Feil: '+err.message); }
};

// Restore saved answers
onValue(ref(db,'spain_answers'), function(snap) {
  if (!snap.exists()) return;
  var ans = snap.val(); if (!ans) return;
  showResultAnimation(ans.q_res, ans.q_winner);
  var allOptFields = ['q_winner','q_cable','q_trump','q_dance','q_var','q_pen',
    'q_argleg','q_espleg','q_messi','q_yamal','q_yamal_bro','q_1966','q_throwin','q_var_goal',
    'q_red','q_turnaro','q_passacc'];
  allOptFields.forEach(function(k) {
    if (ans[k]) {
      var b = document.querySelector('#a_'+k.slice(2)+' .opt[onclick*="\''+ans[k]+'\'"]');
      if(b) b.classList.add('sel');
      opts['a_'+k.slice(2)] = ans[k];
    }
  });
  if (ans.q_res) {
    var p=ans.q_res.split('-');
    if(p.length===2){
      sc.a_res_esp=parseInt(p[0])||0; sc.a_res_arg=parseInt(p[1])||0;
      var ea=document.getElementById('a_res_esp-val'); if(ea)ea.textContent=sc.a_res_esp;
      var eb=document.getElementById('a_res_arg-val'); if(eb)eb.textContent=sc.a_res_arg;
    }
  }
  var numMap={a_half:'q_half',a_yellow:'q_yellow',
    a_passes_esp:'q_passes_esp',a_passes_arg:'q_passes_arg',
    a_corners:'q_corners',a_shots:'q_shots',a_free:'q_free'};
  Object.keys(numMap).forEach(function(ak){
    var val=ans[numMap[ak]];
    if(val!==undefined){sc[ak]=parseInt(val)||0;var el=document.getElementById(ak+'-val');if(el)el.value=sc[ak];}
  });
  if(ans.q_min){var sel=document.getElementById('a_min');if(sel)sel.value=ans.q_min;}
});

// RESULT ANIMATIONS
function showResultAnimation(resultKey, winner) {
  var el = document.getElementById('resultAnim');
  if (!el||!resultKey) { if(el) el.style.display='none'; return; }
  var p=resultKey.split('-');
  if(p.length!==2){el.style.display='none';return;}
  var esp=parseInt(p[0]),arg=parseInt(p[1]);
  if(isNaN(esp)||isNaN(arg)){el.style.display='none';return;}
  el.style.display='block';

  if (winner==='ESP'||esp>arg) {
    // Spain wins - flamenco dancer + confetti + trophy
    el.innerHTML='<svg width="100%" height="130" viewBox="0 0 400 130" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="130" fill="#1a1a2e"/>'
      +'<text x="200" y="18" text-anchor="middle" font-size="15" font-weight="900" fill="#FFD700" font-family="Arial,sans-serif">'+String.fromCodePoint(0x1F1EA,0x1F1F8)+' SPANIA VINNER! '+esp+'-'+arg+'</text>'
      +'<rect x="20" y="0" width="5" height="9" fill="#C60B1E" rx="1"><animate attributeName="y" dur="1.1s" repeatCount="indefinite" values="0;130"/><animate attributeName="opacity" dur="1.1s" repeatCount="indefinite" values="1;0"/></rect>'
      +'<rect x="70" y="0" width="5" height="9" fill="#FFD700" rx="1"><animate attributeName="y" dur="1.4s" repeatCount="indefinite" values="0;130" begin="0.3s"/><animate attributeName="opacity" dur="1.4s" repeatCount="indefinite" values="1;0" begin="0.3s"/></rect>'
      +'<rect x="140" y="0" width="5" height="9" fill="#C60B1E" rx="1"><animate attributeName="y" dur="0.9s" repeatCount="indefinite" values="0;130" begin="0.1s"/><animate attributeName="opacity" dur="0.9s" repeatCount="indefinite" values="1;0" begin="0.1s"/></rect>'
      +'<rect x="210" y="0" width="5" height="9" fill="#FFD700" rx="1"><animate attributeName="y" dur="1.2s" repeatCount="indefinite" values="0;130" begin="0.5s"/><animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="1;0" begin="0.5s"/></rect>'
      +'<rect x="280" y="0" width="5" height="9" fill="#C60B1E" rx="1"><animate attributeName="y" dur="1.0s" repeatCount="indefinite" values="0;130" begin="0.2s"/><animate attributeName="opacity" dur="1.0s" repeatCount="indefinite" values="1;0" begin="0.2s"/></rect>'
      +'<rect x="350" y="0" width="5" height="9" fill="#FFD700" rx="1"><animate attributeName="y" dur="1.3s" repeatCount="indefinite" values="0;130" begin="0.8s"/><animate attributeName="opacity" dur="1.3s" repeatCount="indefinite" values="1;0" begin="0.8s"/></rect>'
      // Flamenco dancer
      +'<g transform="translate(110,80)">'
      +'<path d="M-20,10 Q-30,40 -10,46 Q0,50 10,46 Q30,40 20,10 Z" fill="#C60B1E"><animate attributeName="d" dur="0.6s" repeatCount="indefinite" values="M-20,10 Q-30,40 -10,46 Q0,50 10,46 Q30,40 20,10 Z;M-22,10 Q-26,42 -8,47 Q0,52 8,47 Q26,42 22,10 Z;M-20,10 Q-30,40 -10,46 Q0,50 10,46 Q30,40 20,10 Z"/></path>'
      +'<path d="M-10,46 Q0,54 10,46" fill="none" stroke="#FFD700" stroke-width="3" stroke-linecap="round"><animate attributeName="d" dur="0.6s" repeatCount="indefinite" values="M-10,46 Q0,54 10,46;M-8,47 Q0,56 8,47;M-10,46 Q0,54 10,46"/></path>'
      +'<rect x="-9" y="-8" width="18" height="20" rx="4" fill="#C60B1E"/>'
      +'<rect x="-22" y="-22" width="10" height="18" rx="5" fill="#F5DEB3" transform="rotate(-30 -17 -13)"><animateTransform attributeName="transform" type="rotate" dur="0.6s" repeatCount="indefinite" values="-30 -17 -13;-20 -17 -13;-30 -17 -13"/></rect>'
      +'<rect x="12" y="-22" width="10" height="18" rx="5" fill="#F5DEB3" transform="rotate(30 17 -13)"><animateTransform attributeName="transform" type="rotate" dur="0.6s" repeatCount="indefinite" values="30 17 -13;20 17 -13;30 17 -13"/></rect>'
      +'<ellipse cx="0" cy="-20" rx="12" ry="13" fill="#F5CBA7"/>'
      +'<path d="M-11,-26 Q-8,-38 0,-40 Q8,-38 11,-26 Q8,-30 0,-30 Q-8,-30 -11,-26Z" fill="#1a0a00"/>'
      +'<circle cx="10" cy="-36" r="5" fill="#C60B1E"/><circle cx="10" cy="-36" r="3" fill="#FFD700"/>'
      +'<ellipse cx="-4" cy="-21" rx="2" ry="2.5" fill="#333"/><ellipse cx="4" cy="-21" rx="2" ry="2.5" fill="#333"/>'
      +'<path d="M-5,-15 Q0,-12 5,-15" fill="none" stroke="#C07060" stroke-width="1.5" stroke-linecap="round"/>'
      +'</g>'
      // Trophy
      +'<g transform="translate(285,80)">'
      +'<animateTransform attributeName="transform" type="rotate" dur="3s" repeatCount="indefinite" values="-5 285 80;5 285 80;-5 285 80"/>'
      +'<rect x="-16" y="26" width="32" height="6" rx="2" fill="#B8860B"/>'
      +'<rect x="-10" y="18" width="20" height="9" rx="1" fill="#DAA520"/>'
      +'<rect x="-5" y="6" width="10" height="14" rx="2" fill="#DAA520"/>'
      +'<path d="M-20,-18 Q-22,6 -10,10 L10,10 Q22,6 20,-18 Z" fill="#FFD700"/>'
      +'<path d="M-20,-8 Q-32,-8 -32,2 Q-32,8 -20,8" fill="none" stroke="#DAA520" stroke-width="4" stroke-linecap="round"/>'
      +'<path d="M20,-8 Q32,-8 32,2 Q32,8 20,8" fill="none" stroke="#DAA520" stroke-width="4" stroke-linecap="round"/>'
      +'<text x="0" y="-4" text-anchor="middle" font-size="10" fill="#B8860B">&#9733;</text>'
      +'</g>'
      +'</svg>';

  } else if (winner==='ARG'||arg>esp) {
    // Argentina wins - Messi raising trophy + GOAT + jersey #10
    el.innerHTML='<svg width="100%" height="140" viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="140" fill="#1a1a2e"/>'
      +'<text x="200" y="18" text-anchor="middle" font-size="14" font-weight="900" fill="#74ACDF" font-family="Arial,sans-serif">'+String.fromCodePoint(0x1F1E6,0x1F1F7)+' ARGENTINA VINNER! '+esp+'-'+arg+'</text>'
      // Blue/white confetti
      +'<rect x="20" y="0" width="5" height="9" fill="#74ACDF" rx="1"><animate attributeName="y" dur="1.1s" repeatCount="indefinite" values="0;140"/><animate attributeName="opacity" dur="1.1s" repeatCount="indefinite" values="1;0"/></rect>'
      +'<rect x="70" y="0" width="5" height="9" fill="white" rx="1"><animate attributeName="y" dur="1.4s" repeatCount="indefinite" values="0;140" begin="0.3s"/><animate attributeName="opacity" dur="1.4s" repeatCount="indefinite" values="1;0" begin="0.3s"/></rect>'
      +'<rect x="140" y="0" width="5" height="9" fill="#74ACDF" rx="1"><animate attributeName="y" dur="0.9s" repeatCount="indefinite" values="0;140" begin="0.1s"/><animate attributeName="opacity" dur="0.9s" repeatCount="indefinite" values="1;0" begin="0.1s"/></rect>'
      +'<rect x="210" y="0" width="5" height="9" fill="white" rx="1"><animate attributeName="y" dur="1.2s" repeatCount="indefinite" values="0;140" begin="0.5s"/><animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="1;0" begin="0.5s"/></rect>'
      +'<rect x="280" y="0" width="5" height="9" fill="#74ACDF" rx="1"><animate attributeName="y" dur="1.0s" repeatCount="indefinite" values="0;140" begin="0.2s"/><animate attributeName="opacity" dur="1.0s" repeatCount="indefinite" values="1;0" begin="0.2s"/></rect>'
      +'<rect x="350" y="0" width="5" height="9" fill="white" rx="1"><animate attributeName="y" dur="1.3s" repeatCount="indefinite" values="0;140" begin="0.8s"/><animate attributeName="opacity" dur="1.3s" repeatCount="indefinite" values="1;0" begin="0.8s"/></rect>'
      // Player raising trophy (centre)
      +'<g transform="translate(170,90)">'
      // Body
      +'<rect x="-12" y="-10" width="24" height="28" rx="4" fill="#74ACDF"/>'
      // Blue stripes on white - ARG kit
      +'<rect x="-12" y="-10" width="7" height="28" fill="white" rx="2"/>'
      +'<rect x="5" y="-10" width="7" height="28" fill="white" rx="2"/>'
      // Arms up
      +'<rect x="-28" y="-30" width="10" height="22" rx="4" fill="#74ACDF" transform="rotate(-20 -23 -19)"/>'
      +'<rect x="18" y="-30" width="10" height="22" rx="4" fill="#74ACDF" transform="rotate(20 23 -19)"/>'
      // Head
      +'<ellipse cx="0" cy="-22" rx="12" ry="13" fill="#F5DEB3"/>'
      // Hair
      +'<path d="M-11,-28 Q-10,-38 0,-40 Q10,-38 11,-28 Q8,-32 0,-32 Q-8,-32 -11,-28Z" fill="#5A3010"/>'
      // Beard
      +'<path d="M-8,-14 Q-7,-9 0,-8 Q7,-9 8,-14 Q5,-10 0,-10 Q-5,-10 -8,-14Z" fill="#5A3010" opacity="0.7"/>'
      // Eyes
      +'<ellipse cx="-4" cy="-23" rx="2" ry="2" fill="#333"/>'
      +'<ellipse cx="4" cy="-23" rx="2" ry="2" fill="#333"/>'
      // Trophy held high - bouncing
      +'<g>'
      +'<animateTransform attributeName="transform" type="translate" dur="1.5s" repeatCount="indefinite" values="0,0;0,-6;0,0"/>'
      +'<rect x="-9" y="-54" width="18" height="4" rx="1" fill="#B8860B"/>'
      +'<rect x="-6" y="-60" width="12" height="7" rx="1" fill="#DAA520"/>'
      +'<rect x="-3" y="-68" width="6" height="10" rx="1" fill="#DAA520"/>'
      +'<path d="M-10,-80 Q-12,-64 -6,-60 L6,-60 Q12,-64 10,-80 Z" fill="#FFD700"/>'
      +'<path d="M-10,-74 Q-18,-74 -18,-66 Q-18,-62 -10,-62" fill="none" stroke="#DAA520" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M10,-74 Q18,-74 18,-66 Q18,-62 10,-62" fill="none" stroke="#DAA520" stroke-width="2.5" stroke-linecap="round"/>'
      +'<text x="0" y="-68" text-anchor="middle" font-size="8" fill="#B8860B">&#9733;</text>'
      +'</g>'
      +'</g>'
      // GOAT (right side)
      +'<g transform="translate(310,100)">'
      +'<animateTransform attributeName="transform" type="translate" dur="2s" repeatCount="indefinite" values="310,100;310,96;310,100"/>'
      // Body
      +'<ellipse cx="0" cy="10" rx="22" ry="14" fill="white"/>'
      // Head
      +'<ellipse cx="24" cy="-2" rx="14" ry="11" fill="white"/>'
      // Eye
      +'<ellipse cx="30" cy="-4" rx="2.5" ry="2" fill="#333"/>'
      +'<ellipse cx="30.5" cy="-4.2" rx="1" ry="1.2" fill="white"/>'
      // Nostril
      +'<ellipse cx="36" cy="0" rx="1.5" ry="1" fill="#ccc"/>'
      // Horns
      +'<path d="M18,-10 Q14,-22 18,-26" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M24,-12 Q24,-24 28,-26" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round"/>'
      // Beard
      +'<path d="M30,6 Q32,14 28,18" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>'
      // Legs
      +'<rect x="-14" y="22" width="6" height="14" rx="3" fill="white"/>'
      +'<rect x="-4" y="22" width="6" height="14" rx="3" fill="white"/>'
      +'<rect x="6" y="22" width="6" height="14" rx="3" fill="white"/>'
      +'<rect x="16" y="22" width="6" height="14" rx="3" fill="white"/>'
      // Hooves
      +'<rect x="-14" y="34" width="6" height="4" rx="1" fill="#555"/>'
      +'<rect x="-4" y="34" width="6" height="4" rx="1" fill="#555"/>'
      +'<rect x="6" y="34" width="6" height="4" rx="1" fill="#555"/>'
      +'<rect x="16" y="34" width="6" height="4" rx="1" fill="#555"/>'
      // Tail
      +'<path d="M-22,8 Q-32,4 -30,-4" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>'
      // Ear
      +'<ellipse cx="14" cy="-10" rx="5" ry="8" fill="white" transform="rotate(-20 14 -10)"/>'
      +'<ellipse cx="14" cy="-10" rx="3" ry="5" fill="#ffcccc" transform="rotate(-20 14 -10)"/>'
      +'</g>'
      // Jersey #10 (left side)
      +'<g transform="translate(62,95)">'
      // Jersey body
      +'<rect x="-20" y="-15" width="40" height="42" rx="5" fill="#74ACDF"/>'
      // White stripes
      +'<rect x="-20" y="-15" width="12" height="42" fill="white" rx="3"/>'
      +'<rect x="8" y="-15" width="12" height="42" fill="white" rx="3"/>'
      // Collar
      +'<path d="M-8,-15 Q0,-8 8,-15" fill="none" stroke="#74ACDF" stroke-width="3"/>'
      // Sleeves
      +'<rect x="-34" y="-12" width="15" height="10" rx="4" fill="#74ACDF"/>'
      +'<rect x="19" y="-12" width="15" height="10" rx="4" fill="#74ACDF"/>'
      // Number 10
      +'<text x="0" y="18" text-anchor="middle" font-size="20" font-weight="900" fill="white" font-family="Arial,sans-serif" opacity="0.95">10</text>'
      // Gentle sway
      +'<animateTransform attributeName="transform" type="rotate" dur="3s" repeatCount="indefinite" values="-3 62 95;3 62 95;-3 62 95"/>'
      +'</g>'
      +'</svg>';

  } else {
    // Draw - GOAT wearing jersey #10 + two flags, no shaking
    el.innerHTML='<svg width="100%" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="120" fill="#1a1a2e"/>'
      +'<text x="200" y="18" text-anchor="middle" font-size="13" font-weight="900" fill="#FFD700" font-family="Arial,sans-serif">UAVGJORT '+esp+'-'+arg+' - STRAFFER?</text>'
      // ESP flag (left, static)
      +'<line x1="50" y1="30" x2="50" y2="100" stroke="#888" stroke-width="2"/>'
      +'<rect x="51" y="30" width="40" height="11" fill="#C60B1E" rx="1"/>'
      +'<rect x="51" y="41" width="40" height="11" fill="#FFD700"/>'
      +'<rect x="51" y="52" width="40" height="11" fill="#C60B1E" rx="1"/>'
      +'<circle cx="50" cy="28" r="3" fill="#FFD700"/>'
      // ARG flag (right, static)
      +'<line x1="310" y1="30" x2="310" y2="100" stroke="#888" stroke-width="2"/>'
      +'<rect x="311" y="30" width="40" height="11" fill="#74ACDF" rx="1"/>'
      +'<rect x="311" y="41" width="40" height="11" fill="white"/>'
      +'<circle cx="331" cy="46" r="4" fill="#F6B40E"/>'
      +'<rect x="311" y="52" width="40" height="11" fill="#74ACDF" rx="1"/>'
      +'<circle cx="310" cy="28" r="3" fill="#FFD700"/>'
      // GOAT wearing jersey #10 (centre)
      +'<g transform="translate(200,72)">'
      // Jersey on goat body
      +'<ellipse cx="0" cy="8" rx="26" ry="16" fill="#74ACDF"/>'
      // White stripes on jersey
      +'<rect x="-26" y="-2" width="11" height="20" fill="white" rx="2"/>'
      +'<rect x="15" y="-2" width="11" height="20" fill="white" rx="2"/>'
      // Number 10 on jersey
      +'<text x="0" y="14" text-anchor="middle" font-size="13" font-weight="900" fill="white" font-family="Arial,sans-serif">10</text>'
      // Jersey sleeves
      +'<ellipse cx="-30" cy="2" rx="8" ry="5" fill="#74ACDF" transform="rotate(-20)"/>'
      +'<ellipse cx="30" cy="2" rx="8" ry="5" fill="#74ACDF" transform="rotate(20)"/>'
      // Head
      +'<ellipse cx="28" cy="-10" rx="16" ry="12" fill="white"/>'
      // Horns
      +'<path d="M22,-20 Q18,-34 22,-38" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M30,-22 Q30,-36 34,-38" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round"/>'
      // Eye
      +'<ellipse cx="36" cy="-12" rx="2.5" ry="2" fill="#333"/>'
      +'<ellipse cx="36.5" cy="-12.5" rx="1" ry="1" fill="white"/>'
      // Nostril
      +'<ellipse cx="42" cy="-7" rx="1.5" ry="1" fill="#ccc"/>'
      // Beard
      +'<path d="M36,-3 Q38,6 34,10" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>'
      // Ear
      +'<ellipse cx="16" cy="-16" rx="5" ry="8" fill="white" transform="rotate(-25 16 -16)"/>'
      +'<ellipse cx="16" cy="-16" rx="3" ry="5" fill="#ffcccc" transform="rotate(-25 16 -16)"/>'
      // Legs (static, no animation)
      +'<rect x="-18" y="22" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="-6" y="22" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="6" y="22" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="18" y="22" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="-18" y="36" width="7" height="4" rx="1" fill="#555"/>'
      +'<rect x="-6" y="36" width="7" height="4" rx="1" fill="#555"/>'
      +'<rect x="6" y="36" width="7" height="4" rx="1" fill="#555"/>'
      +'<rect x="18" y="36" width="7" height="4" rx="1" fill="#555"/>'
      // Tail
      +'<path d="M-26,6 Q-36,2 -34,-6" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>'
      +'</g>'
      +'<text x="200" y="116" text-anchor="middle" font-size="9" fill="#666" font-family="Arial,sans-serif">Straffer avgjor...</text>'
      +'</svg>';
  }
}
