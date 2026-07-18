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
var boolQs = ['q_cable','q_trump','q_dance','q_var','q_var_goal','q_argleg','q_espleg','q_messi','q_yamal','q_yamal_bro','q_1966',
               'q_throwin','q_turnaro','q_otgoal','q_subgoal','q_ro','q_cradle',
               'q_longshot','q_oceans'];

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
      q_var:opts.q_var||'', q_var_goal:opts.q_var_goal||'',
      q_argleg:opts.q_argleg||'', q_espleg:opts.q_espleg||'',
      q_var_goal:opts.q_var_goal||'',
      q_messi:opts.q_messi||'', q_yamal:opts.q_yamal||'',
      q_yamal_bro:opts.q_yamal_bro||'', q_1966:opts.q_1966||'',
      q_throwin:opts.q_throwin||'', q_otgoal:opts.q_otgoal||'', q_subgoal:opts.q_subgoal||'',
      q_red:opts.q_red||'', q_turnaro:opts.q_turnaro||'',
      q_passacc:opts.q_passacc||'', q_agediff:opts.q_agediff||'',
      q_ro:opts.q_ro||'', q_cradle:opts.q_cradle||'',
      q_longshot:opts.q_longshot||'', q_oceans:opts.q_oceans||'',
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
    q_var:opts.a_var||'', q_var_goal:opts.a_var_goal||'',
    q_argleg:opts.a_argleg||'', q_espleg:opts.a_espleg||'',
    q_var_goal:opts.a_var_goal||'',
    q_messi:opts.a_messi||'', q_yamal:opts.a_yamal||'',
    q_yamal_bro:opts.a_yamal_bro||'', q_1966:opts.a_1966||'',
    q_throwin:opts.a_throwin||'', q_otgoal:opts.a_otgoal||'', q_subgoal:opts.a_subgoal||'',
    q_red:opts.a_red||'', q_turnaro:opts.a_turnaro||'',
    q_passacc:opts.a_passacc||'', q_agediff:opts.a_agediff||'',
    q_ro:opts.a_ro||'', q_cradle:opts.a_cradle||'',
    q_longshot:opts.a_longshot||'', q_oceans:opts.a_oceans||'',
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
      // 3pt agediff
      if(ans.q_agediff&&e.q_agediff===ans.q_agediff) p+=3;
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
  var allOptFields = ['q_winner','q_cable','q_trump','q_dance','q_var',
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
    // Argentina wins - player raising trophy (centre) + GOAT with jersey #10 on its back (right)
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
      // Player raising trophy (left-centre)
      +'<g transform="translate(140,90)">'
      +'<rect x="-12" y="-10" width="24" height="28" rx="4" fill="#74ACDF"/>'
      +'<rect x="-12" y="-10" width="7" height="28" fill="white" rx="2"/>'
      +'<rect x="5" y="-10" width="7" height="28" fill="white" rx="2"/>'
      +'<rect x="-28" y="-30" width="10" height="22" rx="4" fill="#74ACDF" transform="rotate(-20 -23 -19)"/>'
      +'<rect x="18" y="-30" width="10" height="22" rx="4" fill="#74ACDF" transform="rotate(20 23 -19)"/>'
      +'<ellipse cx="0" cy="-22" rx="12" ry="13" fill="#F5DEB3"/>'
      +'<path d="M-11,-28 Q-10,-38 0,-40 Q10,-38 11,-28 Q8,-32 0,-32 Q-8,-32 -11,-28Z" fill="#5A3010"/>'
      +'<path d="M-8,-14 Q-7,-9 0,-8 Q7,-9 8,-14 Q5,-10 0,-10 Q-5,-10 -8,-14Z" fill="#5A3010" opacity="0.7"/>'
      +'<ellipse cx="-4" cy="-23" rx="2" ry="2" fill="#333"/>'
      +'<ellipse cx="4" cy="-23" rx="2" ry="2" fill="#333"/>'
      // Trophy bouncing
      +'<g><animateTransform attributeName="transform" type="translate" dur="1.5s" repeatCount="indefinite" values="0,0;0,-6;0,0"/>'
      +'<rect x="-9" y="-54" width="18" height="4" rx="1" fill="#B8860B"/>'
      +'<rect x="-6" y="-60" width="12" height="7" rx="1" fill="#DAA520"/>'
      +'<rect x="-3" y="-68" width="6" height="10" rx="1" fill="#DAA520"/>'
      +'<path d="M-10,-80 Q-12,-64 -6,-60 L6,-60 Q12,-64 10,-80 Z" fill="#FFD700"/>'
      +'<path d="M-10,-74 Q-18,-74 -18,-66 Q-18,-62 -10,-62" fill="none" stroke="#DAA520" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M10,-74 Q18,-74 18,-66 Q18,-62 10,-62" fill="none" stroke="#DAA520" stroke-width="2.5" stroke-linecap="round"/>'
      +'<text x="0" y="-68" text-anchor="middle" font-size="8" fill="#B8860B">&#9733;</text>'
      +'</g>'
      +'</g>'
      // GOAT with jersey draped on its back (right side)
      +'<g transform="translate(305,88)">'
      +'<animateTransform attributeName="transform" type="translate" dur="2s" repeatCount="indefinite" values="305,88;305,84;305,88"/>'
      // Goat body
      +'<ellipse cx="0" cy="18" rx="28" ry="18" fill="white"/>'
      // Jersey draped on back - sits on top of body
      +'<rect x="-22" y="4" width="44" height="22" rx="4" fill="#74ACDF"/>'
      +'<rect x="-22" y="4" width="13" height="22" fill="white" rx="3"/>'
      +'<rect x="9" y="4" width="13" height="22" fill="white" rx="3"/>'
      +'<text x="0" y="22" text-anchor="middle" font-size="16" font-weight="900" fill="white" font-family="Arial,sans-serif">10</text>'
      // Goat head (right side)
      +'<ellipse cx="30" cy="4" rx="16" ry="13" fill="white"/>'
      // Horns
      +'<path d="M24,-8 Q20,-22 24,-26" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round"/>'
      +'<path d="M32,-10 Q32,-24 36,-26" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round"/>'
      // Eye
      +'<ellipse cx="38" cy="2" rx="2.5" ry="2" fill="#333"/>'
      +'<ellipse cx="38.5" cy="1.8" rx="1" ry="1" fill="white"/>'
      // Nostril
      +'<ellipse cx="44" cy="7" rx="1.5" ry="1" fill="#ccc"/>'
      // Beard
      +'<path d="M38,14 Q40,22 36,26" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>'
      // Ear
      +'<ellipse cx="18" cy="-4" rx="5" ry="8" fill="white" transform="rotate(-25 18 -4)"/>'
      +'<ellipse cx="18" cy="-4" rx="3" ry="5" fill="#ffcccc" transform="rotate(-25 18 -4)"/>'
      // Legs
      +'<rect x="-18" y="34" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="-7" y="34" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="4" y="34" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="15" y="34" width="7" height="16" rx="3" fill="white"/>'
      +'<rect x="-18" y="48" width="7" height="4" rx="1" fill="#555"/>'
      +'<rect x="-7" y="48" width="7" height="4" rx="1" fill="#555"/>'
      +'<rect x="4" y="48" width="7" height="4" rx="1" fill="#555"/>'
      +'<rect x="15" y="48" width="7" height="4" rx="1" fill="#555"/>'
      // Tail
      +'<path d="M-28,14 Q-38,10 -36,2" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>'
      +'</g>'
      +'</svg>';

  } else {
    // Draw - nervous eyes: left=Spain (red/yellow iris), right=Argentina (blue/white iris)
    el.innerHTML='<svg width="100%" height="110" viewBox="0 0 400 110" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="110" fill="#1a1a2e"/>'
      +'<text x="200" y="18" text-anchor="middle" font-size="13" font-weight="900" fill="#FFD700" font-family="Arial,sans-serif">UAVGJORT '+esp+'-'+arg+' - STRAFFER?</text>'
      // === SPAIN eyes (left) - red sclera tinge, yellow/red iris ===
      +'<g transform="translate(112,62)">'
      // Eye whites (slight warm tinge)
      +'<ellipse cx="-22" cy="0" rx="24" ry="19" fill="#fff8f0"/>'
      +'<ellipse cx="22" cy="0" rx="24" ry="19" fill="#fff8f0"/>'
      // Irises - red with yellow ring (Spanish flag colors)
      +'<ellipse cx="-22" cy="0" rx="12" ry="14" fill="#C60B1E">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="-26;-18;-26"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="12" ry="14" fill="#C60B1E">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="18;26;18"/>'
      +'</ellipse>'
      // Yellow ring inside iris
      +'<ellipse cx="-22" cy="0" rx="7" ry="9" fill="#FFD700">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="-26;-18;-26"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="7" ry="9" fill="#FFD700">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="18;26;18"/>'
      +'</ellipse>'
      // Pupils
      +'<ellipse cx="-22" cy="0" rx="4" ry="5" fill="#111">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="-26;-18;-26"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="4" ry="5" fill="#111">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="18;26;18"/>'
      +'</ellipse>'
      // Blink
      +'<ellipse cx="-22" cy="0" rx="24" ry="19" fill="#1a1a2e" opacity="0">'
      +'<animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;0;0;0;0;1;0"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="24" ry="19" fill="#1a1a2e" opacity="0">'
      +'<animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;0;0;0;0;1;0"/>'
      +'</ellipse>'
      // Eyebrows
      +'<path d="M-42,-22 Q-22,-32 -2,-22" fill="none" stroke="#8B5020" stroke-width="3" stroke-linecap="round"/>'
      +'<path d="M6,-22 Q26,-32 46,-22" fill="none" stroke="#8B5020" stroke-width="3" stroke-linecap="round"/>'
      // Label
      +'<text x="0" y="28" text-anchor="middle" font-size="9" fill="#C60B1E" font-family="Arial,sans-serif" font-weight="900">ESP</text>'
      +'</g>'
      // === ARGENTINA eyes (right) - blue iris, white ring ===
      +'<g transform="translate(288,62)">'
      +'<ellipse cx="-22" cy="0" rx="24" ry="19" fill="#f0f5ff"/>'
      +'<ellipse cx="22" cy="0" rx="24" ry="19" fill="#f0f5ff"/>'
      // Irises - blue with white ring (Argentine flag colors)
      +'<ellipse cx="-22" cy="0" rx="12" ry="14" fill="#74ACDF">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="-18;-26;-18"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="12" ry="14" fill="#74ACDF">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="26;18;26"/>'
      +'</ellipse>'
      // White ring inside iris
      +'<ellipse cx="-22" cy="0" rx="7" ry="9" fill="white">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="-18;-26;-18"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="7" ry="9" fill="white">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="26;18;26"/>'
      +'</ellipse>'
      // Pupils
      +'<ellipse cx="-22" cy="0" rx="4" ry="5" fill="#111">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="-18;-26;-18"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="4" ry="5" fill="#111">'
      +'<animate attributeName="cx" dur="2.2s" repeatCount="indefinite" values="26;18;26"/>'
      +'</ellipse>'
      // Blink (offset)
      +'<ellipse cx="-22" cy="0" rx="24" ry="19" fill="#1a1a2e" opacity="0">'
      +'<animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;0;0;0;0;1;0" begin="0.5s"/>'
      +'</ellipse>'
      +'<ellipse cx="22" cy="0" rx="24" ry="19" fill="#1a1a2e" opacity="0">'
      +'<animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;0;0;0;0;1;0" begin="0.5s"/>'
      +'</ellipse>'
      // Eyebrows
      +'<path d="M-42,-22 Q-22,-32 -2,-22" fill="none" stroke="#5A7A9A" stroke-width="3" stroke-linecap="round"/>'
      +'<path d="M6,-22 Q26,-32 46,-22" fill="none" stroke="#5A7A9A" stroke-width="3" stroke-linecap="round"/>'
      // Label
      +'<text x="0" y="28" text-anchor="middle" font-size="9" fill="#74ACDF" font-family="Arial,sans-serif" font-weight="900">ARG</text>'
      +'</g>'
      +'<text x="200" y="100" text-anchor="middle" font-size="10" fill="#666" font-family="Arial,sans-serif">Straffer avgjor...</text>'
      +'</svg>';
  }
}

var avSVGs = {
  yamal:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">19</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#8B5A2B"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#1a0a00"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  rodri:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">16</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  pedri:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">8</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  williams:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">17</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#8B5A2B"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#1a0a00"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  carvajal:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">2</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  laporte:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">14</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#555"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  fabianruiz:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">6</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  oyarzabal:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#C60B1E"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">11</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#C60B1E"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#333"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  messi:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">10</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  martinez:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">23</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#555"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  alvarez:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">9</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  macallister:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">5</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  lmartinez:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">22</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  depaul:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">7</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  molina:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">26</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  tagliafico:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#74ACDF"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">3</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#74ACDF"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#555"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>'
};

var medals=['🥇','🥈','🥉'];
var lbMode='total';
var teamFilter='';
var allEntries=[];

onValue(ref(db,'spain_entries'), function(snap) {
  allEntries=[];
  if(snap.exists()) snap.forEach(function(c){ allEntries.push(c.val()); });
  renderLB();
  populatePlayerSelect();
  populateTeamFilter();
});

window.setLbMode = function(mode) {
  lbMode=mode;
  document.querySelectorAll('.lb-tab').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('lbt-'+mode).classList.add('active');
  var fw=document.getElementById('teamFilterWrap');
  if(fw) fw.style.display=mode==='team'?'block':'none';
  renderLB();
};

window.setTeamFilter = function(val) {
  teamFilter=val;
  renderLB();
};

function populateTeamFilter() {
  var sel=document.getElementById('teamFilter');
  if(!sel) return;
  var current=sel.value;
  sel.innerHTML='<option value="">-- Alle lag --</option>';
  var teams=[];
  allEntries.forEach(function(e){ if(e.team&&teams.indexOf(e.team)<0) teams.push(e.team); });
  teams.sort().forEach(function(t){
    var opt=document.createElement('option'); opt.value=t; opt.textContent='Lag: '+t; sel.appendChild(opt);
  });
  if(current) sel.value=current;
}

function renderLB() {
  var list=document.getElementById('lbList');
  var empty=document.getElementById('lbEmpty');
  if(!list) return;
  if(!allEntries.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  if(lbMode==='total') {
    var rows=allEntries.slice().sort(function(a,b){return b.pts-a.pts;});
    renderRows(list,rows,function(e){return (avNames[e.avatar]||'')+(e.team?' · Lag: '+e.team:'');});
  } else if(lbMode==='team') {
    var filtered=teamFilter?allEntries.filter(function(e){return e.team===teamFilter;}):allEntries.slice();
    filtered.sort(function(a,b){return b.pts-a.pts;});
    renderRows(list,filtered,function(e){return (avNames[e.avatar]||'')+(e.team?' · Lag: '+e.team:'Ingen lag');});
    document.getElementById('lb-info').textContent=(teamFilter?'Lag: '+teamFilter:'Alle lag')+' - '+filtered.length+' deltakere - '+new Date().toLocaleTimeString('no-NO');
    return;
  } else if(lbMode==='teamavg') {
    var teamTot={};
    allEntries.forEach(function(e){
      var t=e.team||'__ingen__';
      if(!teamTot[t]) teamTot[t]={team:t,total:0,count:0};
      teamTot[t].total+=e.pts; teamTot[t].count+=1;
    });
    var rows=Object.values(teamTot).map(function(t){
      return {name:t.team==='__ingen__'?'Ingen lag':'Lag: '+t.team,pts:Math.round(t.total/t.count*10)/10,count:t.count};
    }).sort(function(a,b){return b.pts-a.pts;});
    list.innerHTML=rows.map(function(r,i){
      var cls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
      var rank=medals[i]||(i+1)+'.';
      return '<div class="lb-row '+cls+'"><div class="lb-rank">'+rank+'</div>'
        +'<div style="font-size:28px;width:48px;text-align:center;">👥</div>'
        +'<div style="flex:1;min-width:0;"><div class="lb-name">'+r.name+'</div>'
        +'<div class="lb-sub">'+r.count+' deltakere - snitt</div></div>'
        +'<div class="lb-pts">'+r.pts+' pts</div></div>';
    }).join('');
    document.getElementById('lb-info').textContent='Live - '+rows.length+' lag';
    return;
  }
}

function renderRows(list,rows,subFn) {
  var maxPts=70;
  list.innerHTML=rows.map(function(e,i){
    var cls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
    var rank=medals[i]||(i+1)+'.';
    var bar=Math.min(100,Math.round(e.pts/maxPts*100));
    var av=(e.avatar&&avSVGs[e.avatar])?avSVGs[e.avatar]:'<div style="font-size:24px;text-align:center;">'+(e.emoji||'⚽')+'</div>';
    return '<div class="lb-row '+cls+'"><div class="lb-rank">'+rank+'</div>'
      +'<div style="width:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'+av+'</div>'
      +'<div style="flex:1;min-width:0;"><div class="lb-name">'+e.name+'</div>'
      +'<div class="lb-sub">'+subFn(e)+'</div>'
      +'<div style="background:#e0e0e0;border-radius:4px;height:5px;margin-top:4px;overflow:hidden;">'
      +'<div style="background:#C9A84C;height:5px;width:'+bar+'%;border-radius:4px;"></div>'
      +'</div></div><div class="lb-pts">'+e.pts+' pts</div></div>';
  }).join('');
  document.getElementById('lb-info').textContent='Live - '+rows.length+' deltakere - '+new Date().toLocaleTimeString('no-NO');
}

function populatePlayerSelect() {
  var sel=document.getElementById('playerSelect');
  var card=document.getElementById('playerDetailCard');
  if(!sel) return;
  if(!allEntries.length){if(card)card.style.display='none';return;}
  if(card) card.style.display='block';
  var current=sel.value;
  sel.innerHTML='<option value="">-- Velg spiller --</option>';
  allEntries.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).forEach(function(e){
    var opt=document.createElement('option');
    opt.value=e.name; opt.textContent=e.name+' ('+e.pts+' pts)'+(e.team?' · '+e.team:'');
    sel.appendChild(opt);
  });
  if(current) sel.value=current;
}

window.showPlayerDetail = function(name) {
  var body=document.getElementById('playerDetailBody');
  if(!body||!name){if(body)body.innerHTML='';return;}
  var e=allEntries.find(function(x){return x.name===name;});
  if(!e){body.innerHTML='';return;}
  var rows=[
    ['Spiller',avNames[e.avatar]||e.avatar],['Lag',e.team||'-'],
    ['Hvem vinner',e.q_winner],['Resultat',e.q_res],
    ['Trump ved Infantino',e.q_trump],['ARG-legende sett',e.q_argleg],
    ['ESP-legende sett',e.q_espleg],['Yamals lillebror sett',e.q_yamal_bro],
    ["Ocean's Eleven sett",e.q_oceans],
    ['Messi mal/assist',e.q_messi],['Yamal scorer/assist',e.q_yamal],
    ['Mal fra utsiden 16m',e.q_longshot],['Mal pa overtid',e.q_otgoal],
    ['Innbytter scorer',e.q_subgoal],
    ['Trump-dansen',e.q_dance],['Baby-feiring',e.q_cradle],
    ['Kamerawire truffet',e.q_cable],['VAR omgjort',e.q_var],
    ['Mal annulert VAR',e.q_var_goal],['Innkast 10 sek',e.q_throwin],
    ['VM 1966 nevnt',e.q_1966],['Ro nevnt',e.q_ro],
    ['Mal 1. omgang',e.q_half],['Gule kort',e.q_yellow],
    ['Rodt kort',e.q_red],['Argentina snur',e.q_turnaro],
    ['Hoyest pasningsnoyk',e.q_passacc],['Aldersforskjell scorere',e.q_agediff],
    ['Kampens 1. mal',e.q_min],
    ['Pasninger Spania',e.q_passes_esp],['Pasninger Argentina',e.q_passes_arg],
    ['Corners',e.q_corners],['Skudd pa mal',e.q_shots],['Frispark',e.q_free],
    ['Poeng',e.pts+' pts'],
  ];
  body.innerHTML=rows.map(function(r){
    return '<div class="detail-row"><span class="detail-label">'+r[0]+': </span><span class="detail-val">'+(r[1]!==undefined?r[1]:'-')+'</span></div>';
  }).join('');
};
