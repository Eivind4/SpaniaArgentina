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

var DEADLINE = new Date('2026-07-11T23:00:00');
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

onValue(ref(db, 'spain_argentina_entries'), function(snap) {
  var count = snap.exists() ? snap.size : 0;
  var el = document.getElementById('fbStatus');
  if (el) el.innerHTML = 'Firebase koplet - ' + count + ' deltakere';
});

// State
var sc = {
  q3a:0,q3b:0,q4:0,q5:0,q9:0,q10:0,q11:0,q12:0,q13:0,
  a3a:0,a3b:0,a4:0,a5:0,a9:0,a10:0,a11:0,a12:0,a13:0
};
var opts = {};
var selAvatar = null;
var selEmoji = '';
var selTeam = null;
var avNames = {
  haaland:'Haaland #9', odegaard:'Odegaard #8', nusa:'Nusa #11',
  nyland:'Nyland #1', berge:'Berge #23', sorloth:'Sorloth #20',
  bobb:'Bobb #22', ajer:'Ajer #6',
  messi:'Messi #10', alvarez:'Alvarez #9'
};

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
  sc[k] = Math.max(0, Math.min(500, (sc[k]||0)+d));
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
  if (isNaN(v)||v<0) v=0;
  if (v>500) v=500;
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
    document.getElementById('teamConfirmed').textContent = selTeam ? 'Lag: ' + selTeam : '';
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
    opt.value = name; opt.textContent = 'Lag: ' + name;
    sel.insertBefore(opt, sel.querySelector('[value="__new__"]'));
  }
  sel.value = name;
  document.getElementById('newTeamWrap').style.display = 'none';
  document.getElementById('teamConfirmed').textContent = 'Lag: ' + name;
};

// Load teams from Firebase
onValue(ref(db, 'eng_teams'), function(snap) {
  var sel = document.getElementById('teamSelect');
  if (!sel || !snap.exists()) return;
  var current = sel.value;
  while (sel.options.length > 2) sel.remove(1);
  var teams = [];
  snap.forEach(function(c){ teams.push(c.val()); });
  teams.sort();
  var newOpt = sel.querySelector('[value="__new__"]');
  teams.forEach(function(t) {
    var opt = document.createElement('option');
    opt.value = t; opt.textContent = 'Lag: ' + t;
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
  if (!opts.q1) { alert('Hvem tror du vinner?'); return; }

  ['q4','q5','q9','q10','q11','q12','q13'].forEach(function(k){ window.syncInput(k); });

  var nameKey = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
  try {
    var existing = await get(ref(db, 'spain_argentina_entries/'+nameKey));
    if (existing.exists()) {
      if (!confirm(name+' er allerede registrert! Vil du overskrive?')) return;
    }
    if (selTeam) {
      var teamKey = selTeam.toLowerCase().replace(/[^a-z0-9]/g,'_');
      await set(ref(db, 'eng_teams/'+teamKey), selTeam);
    }
    var entry = {
      name:name, avatar:selAvatar, emoji:selEmoji, team:selTeam||'',
      q1:opts.q1||'',
      q_norscorer:opts.q_norscorer||'', q_engscorer:opts.q_engscorer||'',
      q_engroy:opts.q_engroy||'', q_norroy:opts.q_norroy||'',
      q_rekdal:opts.q_rekdal||'', q_2nil:opts.q_2nil||'',
      q_brit:opts.q_brit||'', q_engpen:opts.q_engpen||'',
      q_ro:opts.q_ro||'', q_home:opts.q_home||'',
      q3:sc.q3a+'-'+sc.q3b,
      q4:sc.q4,q5:sc.q5,q9:sc.q9,q10:sc.q10,
      q11:sc.q11,q12:sc.q12,q13:sc.q13,
      q7:document.getElementById('q7').value||'',
      q8:opts.q8||'', pts:0, ts:Date.now()
    };
    await set(ref(db,'spain_argentina_entries/'+nameKey), entry);
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
  ['q3a','q3b','q4','q5','q9','q10','q11','q12','q13'].forEach(function(k){
    sc[k]=0;
    var el=document.getElementById(k+'-val');
    if(el){ if(el.tagName==='INPUT') el.value='0'; else el.textContent='0'; }
  });
  document.getElementById('q7').value='';
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

var boolQs = ['q_engroy','q_norroy','q_rekdal','q_2nil','q_brit','q_engpen','q_ro','q_home'];

window.calcAndSaveScores = async function() {
  ['a4','a5','a9','a10','a11','a12','a13'].forEach(function(k){ window.syncInput(k); });
  var ans = {
    q1:opts.a1||'',
    q_norscorer:opts.a_norscorer||'', q_engscorer:opts.a_engscorer||'',
    q_engroy:opts.a_engroy||'', q_norroy:opts.a_norroy||'',
    q_rekdal:opts.a_rekdal||'', q_2nil:opts.a_2nil||'',
    q_brit:opts.a_brit||'', q_engpen:opts.a_engpen||'',
    q_ro:opts.a_ro||'', q_home:opts.a_home||'',
    q3:sc.a3a+'-'+sc.a3b,
    q4:sc.a4,q5:sc.a5,q7:document.getElementById('a7').value||'',
    q8:opts.a8||'',
    q9:sc.a9,q10:sc.a10,q11:sc.a11,q12:sc.a12,q13:sc.a13
  };
  await set(ref(db,'eng_answers'), ans);
  try {
    var snap = await get(ref(db,'spain_argentina_entries'));
    if (!snap.exists()) { alert('Ingen deltakere.'); return; }
    var updates = {};
    snap.forEach(function(child) {
      var e = child.val(); var p = 0;
      // 1pt booleans
      if (ans.q1 && e.q1===ans.q1) p+=1;
      boolQs.forEach(function(k){ if(ans[k]&&e[k]===ans[k]) p+=1; });
      // result 5/2
      if (ans.q3&&e.q3===ans.q3) { p+=5; }
      else if (ans.q3) {
        var ag=ans.q3.split('-'),eg=(e.q3||'').split('-');
        if(ag.length===2&&eg.length===2&&(ag[0]===eg[0]||ag[1]===eg[1])) p+=2;
      }
      // 2pt
      if(parseInt(e.q4)===parseInt(ans.q4)) p+=2;
      if(parseInt(e.q5)===parseInt(ans.q5)) p+=2;
      if(ans.q8&&e.q8===ans.q8) p+=2;
      // 3pt
      if(ans.q7&&e.q7&&e.q7===ans.q7) p+=3;
      // pct
      p+=pctScore(parseInt(e.q9),parseInt(ans.q9),5);
      p+=pctScore(parseInt(e.q10),parseInt(ans.q10),5);
      p+=pctScore(parseInt(e.q11),parseInt(ans.q11),5);
      p+=pctScore(parseInt(e.q12),parseInt(ans.q12),5);
      p+=pctScore(parseInt(e.q13),parseInt(ans.q13),5);
      updates['spain_argentina_entries/'+child.key+'/pts'] = Math.round(p*10)/10;
    });
    await update(ref(db), updates);
    alert('Poeng oppdatert!');
    showResultAnimation(ans.q3, ans.q1);
  } catch(err) { alert('Feil: '+err.message); }
};

// Load saved answers
onValue(ref(db,'eng_answers'), function(snap) {
  if (!snap.exists()) return;
  var ans = snap.val(); if (!ans) return;
  showResultAnimation(ans.q3, ans.q1);
  // Restore opt buttons
  var optFields = ['q1','q_norscorer','q_engscorer','q_engroy','q_norroy','q_rekdal','q_2nil','q_brit','q_engpen','q_ro','q_home','q8'];
  optFields.forEach(function(k) {
    var ak = 'a'+k.replace('q',''); // a1, a_norscorer etc
    if (k.startsWith('q_')) ak = 'a'+k.slice(1);
    if (ans[k]) {
      var b = document.querySelector('#'+ak+' .opt[onclick*="\''+ans[k]+'\'"]');
      if(b) b.classList.add('sel');
      opts[ak] = ans[k];
    }
  });
  if (ans.q3) {
    var p=ans.q3.split('-');
    if(p.length===2){ sc.a3a=parseInt(p[0])||0;sc.a3b=parseInt(p[1])||0;
      var ea=document.getElementById('a3a-val');if(ea)ea.textContent=sc.a3a;
      var eb=document.getElementById('a3b-val');if(eb)eb.textContent=sc.a3b; }
  }
  var nums={a4:'q4',a5:'q5',a9:'q9',a10:'q10',a11:'q11',a12:'q12',a13:'q13',};
  Object.keys(nums).forEach(function(ak){
    var val=ans[nums[ak]];
    if(val!==undefined){sc[ak]=parseInt(val)||0;var el=document.getElementById(ak+'-val');if(el)el.value=sc[ak];}
  });
  if(ans.q7){var sel=document.getElementById('a7');if(sel)sel.value=ans.q7;}
});

// RESULT ANIMATIONS
function showResultAnimation(resultKey, winner) {
  var el = document.getElementById('resultAnim');
  if (!el||!resultKey) { if(el) el.style.display='none'; return; }
  var p=resultKey.split('-');
  if(p.length!==2){el.style.display='none';return;}
  var nor=parseInt(p[0]),eng=parseInt(p[1]);
  if(isNaN(nor)||isNaN(eng)){el.style.display='none';return;}
  el.style.display='block';

  if (winner==='Spania'||nor>eng) {
    // Norway wins - celebration boats
    el.innerHTML='<svg width="100%" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="120" fill="#1a3a6a"/>'
      +'<text x="200" y="20" text-anchor="middle" font-size="15" font-weight="900" fill="#FFD700" font-family="Arial,sans-serif">SPANIA VINNER! '+nor+'-'+eng+'</text>'
      +'<rect x="20" y="0" width="6" height="10" fill="#EF3340" rx="1"><animate attributeName="y" dur="1.1s" repeatCount="indefinite" values="0;110"/><animate attributeName="opacity" dur="1.1s" repeatCount="indefinite" values="1;0"/></rect>'
      +'<rect x="70" y="0" width="6" height="10" fill="#FFD700" rx="1"><animate attributeName="y" dur="1.3s" repeatCount="indefinite" values="0;110" begin="0.3s"/><animate attributeName="opacity" dur="1.3s" repeatCount="indefinite" values="1;0" begin="0.3s"/></rect>'
      +'<rect x="130" y="0" width="6" height="10" fill="white" rx="1"><animate attributeName="y" dur="0.9s" repeatCount="indefinite" values="0;110" begin="0.1s"/><animate attributeName="opacity" dur="0.9s" repeatCount="indefinite" values="1;0" begin="0.1s"/></rect>'
      +'<rect x="200" y="0" width="6" height="10" fill="#EF3340" rx="1"><animate attributeName="y" dur="1.2s" repeatCount="indefinite" values="0;110" begin="0.5s"/><animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="1;0" begin="0.5s"/></rect>'
      +'<rect x="270" y="0" width="6" height="10" fill="#FFD700" rx="1"><animate attributeName="y" dur="1.0s" repeatCount="indefinite" values="0;110" begin="0.2s"/><animate attributeName="opacity" dur="1.0s" repeatCount="indefinite" values="1;0" begin="0.2s"/></rect>'
      +'<rect x="340" y="0" width="6" height="10" fill="white" rx="1"><animate attributeName="y" dur="1.4s" repeatCount="indefinite" values="0;110" begin="0.6s"/><animate attributeName="opacity" dur="1.4s" repeatCount="indefinite" values="1;0" begin="0.6s"/></rect>'
      +'<g><animateTransform attributeName="transform" type="translate" dur="5s" repeatCount="indefinite" values="400,0;-200,0"/>'
      +'<ellipse cx="0" cy="78" rx="60" ry="7" fill="#C8943A"/>'
      +'<circle cx="-40" cy="70" r="5" fill="#F5DEB3"/><rect x="-46" y="72" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<circle cx="-18" cy="70" r="5" fill="#F5CBA7"/><rect x="-24" y="72" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<circle cx="4" cy="70" r="5" fill="#F5DEB3"/><rect x="-2" y="72" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<circle cx="26" cy="70" r="5" fill="#8B5A2B"/><rect x="20" y="72" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<rect x="-4" y="58" width="14" height="10" fill="#EF3340" rx="1"/>'
      +'<rect x="-4" y="63" width="14" height="2" fill="white"/>'
      +'<rect x="0" y="58" width="2" height="10" fill="white"/>'
      +'<rect x="0.4" y="58" width="1" height="10" fill="#003087"/>'
      +'</g>'
      +'<g><animateTransform attributeName="transform" type="translate" dur="5s" repeatCount="indefinite" values="200,0;-400,0"/>'
      +'<ellipse cx="0" cy="100" rx="60" ry="7" fill="#C8943A"/>'
      +'<circle cx="-40" cy="92" r="5" fill="#F5CBA7"/><rect x="-46" y="94" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<circle cx="-18" cy="92" r="5" fill="#F5DEB3"/><rect x="-24" y="94" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<circle cx="4" cy="92" r="5" fill="#F5DEB3"/><rect x="-2" y="94" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'<circle cx="26" cy="92" r="5" fill="#8B5A2B"/><rect x="20" y="94" width="12" height="8" rx="2" fill="#EF3340"/>'
      +'</g>'
      +'</svg>';

  } else if (winner==='Argentina'||eng>nor) {
    // Argentina wins - British gentleman drinking tea + broken oar
    el.innerHTML='<svg width="100%" height="130" viewBox="0 0 400 130" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="130" fill="#1a1a2e"/>'
      +'<text x="200" y="18" text-anchor="middle" font-size="14" font-weight="900" fill="#CF081F" font-family="Arial,sans-serif">ARGENTINA VINNER '+nor+'-'+eng+'</text>'
      // British gentleman left: bowler hat, suit, umbrella, tea cup
      +'<g transform="translate(90,60)">'
      // Suit body
      +'<rect x="-18" y="8" width="36" height="38" rx="4" fill="#2a2a4a"/>'
      // White shirt/tie
      +'<rect x="-4" y="8" width="8" height="20" fill="white" rx="1"/>'
      +'<polygon points="0,28 -3,10 3,10" fill="#CF081F"/>'
      // Arms: one holds tea cup, one holds umbrella
      +'<rect x="-32" y="10" width="15" height="9" rx="4" fill="#2a2a4a"/>'
      +'<rect x="17" y="10" width="15" height="9" rx="4" fill="#2a2a4a"/>'
      // Tea cup in left hand
      +'<rect x="-36" y="16" width="12" height="9" rx="2" fill="#f5f0e0"/>'
      +'<path d="M-36,20 Q-42,20 -42,23 Q-42,26 -36,26" fill="none" stroke="#f5f0e0" stroke-width="1.5"/>'
      +'<rect x="-35" y="17" width="10" height="3" fill="#8B4513" rx="1"/>'
      // Umbrella in right hand - handle curve then shaft
      +'<line x1="32" y1="18" x2="32" y2="55" stroke="#2a2a4a" stroke-width="2.5"/>'
      +'<path d="M24,18 Q32,10 40,18" fill="#CF081F" stroke="#CF081F" stroke-width="1"/>'
      +'<path d="M32,55 Q32,60 28,60" fill="none" stroke="#2a2a4a" stroke-width="2.5"/>'
      // Head
      +'<ellipse cx="0" cy="-10" rx="16" ry="18" fill="#F5DEB3"/>'
      // Bowler hat
      +'<rect x="-18" y="-28" width="36" height="5" rx="2" fill="#111"/>'
      +'<rect x="-12" y="-46" width="24" height="20" rx="4" fill="#111"/>'
      // Moustache
      +'<path d="M-8,-5 Q-4,-8 0,-6 Q4,-8 8,-5" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"/>'
      // Eyes (calm, slightly smug)
      +'<ellipse cx="-6" cy="-13" rx="3" ry="2.5" fill="#333"/>'
      +'<ellipse cx="6" cy="-13" rx="3" ry="2.5" fill="#333"/>'
      // Monocle
      +'<circle cx="6" cy="-13" r="5" fill="none" stroke="#888" stroke-width="1.2"/>'
      +'<line x1="11" y1="-9" x2="13" y2="-5" stroke="#888" stroke-width="1"/>'
      // Steam from tea
      +'<path d="M-32,14 Q-29,10 -32,6" fill="none" stroke="#ccc" stroke-width="1" opacity="0">'
      +'<animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0;0.8;0"/>'
      +'<animate attributeName="d" dur="2s" repeatCount="indefinite" values="M-32,14 Q-29,10 -32,6;M-32,14 Q-28,8 -32,4;M-32,14 Q-29,10 -32,6"/>'
      +'</path>'
      +'<path d="M-29,14 Q-26,10 -29,6" fill="none" stroke="#ccc" stroke-width="1" opacity="0">'
      +'<animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0;0.6;0" begin="0.5s"/>'
      +'</path>'
      +'</g>'
      // Broken oar floating right
      +'<g transform="translate(260,95) rotate(-15)">'
      +'<animateTransform attributeName="transform" type="rotate" dur="3s" repeatCount="indefinite" values="-15 0 0;-9 0 0;-17 0 0;-15 0 0" additive="sum"/>'
      +'<line x1="-30" y1="0" x2="4" y2="-6" stroke="#9A7040" stroke-width="3" stroke-linecap="round"/>'
      +'<line x1="4" y1="-6" x2="28" y2="10" stroke="#9A7040" stroke-width="3" stroke-linecap="round"/>'
      +'<line x1="4" y1="-6" x2="9" y2="-13" stroke="#7A5020" stroke-width="1.5" stroke-linecap="round"/>'
      +'<line x1="4" y1="-6" x2="-1" y2="-13" stroke="#7A5020" stroke-width="1.5" stroke-linecap="round"/>'
      +'<rect x="18" y="5" width="11" height="7" rx="3" fill="#5A3010" transform="rotate(40 24 9)"/>'
      +'</g>'
      // Water ripple
      +'<ellipse cx="260" cy="115" rx="30" ry="5" fill="none" stroke="rgba(100,180,255,0.3)" stroke-width="1">'
      +'<animate attributeName="rx" dur="2s" repeatCount="indefinite" values="20;40;20"/>'
      +'<animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.5;0;0.5"/>'
      +'</ellipse>'
      +'</svg>';

  } else {
    // Draw - nervous Norwegian supporter
    el.innerHTML='<svg width="100%" height="130" viewBox="0 0 400 130" xmlns="http://www.w3.org/2000/svg">'
      +'<rect width="400" height="130" fill="#1a1a2e"/>'
      +'<circle cx="30" cy="20" r="1.5" fill="white" opacity="0.4"/>'
      +'<circle cx="80" cy="10" r="1" fill="white" opacity="0.3"/>'
      +'<circle cx="150" cy="15" r="1.5" fill="white" opacity="0.4"/>'
      +'<circle cx="320" cy="12" r="1" fill="white" opacity="0.3"/>'
      +'<circle cx="370" cy="22" r="1.5" fill="white" opacity="0.4"/>'
      +'<text x="200" y="18" text-anchor="middle" font-size="13" font-weight="900" fill="#FFD700" font-family="Arial,sans-serif">UAVGJORT '+nor+'-'+eng+' - STRAFFER?</text>'
      +'<g transform="translate(200,78)">'
      +'<animateTransform attributeName="transform" type="scale" dur="1.8s" repeatCount="indefinite" values="1,1;1.02,1.02;1,1" additive="sum"/>'
      +'<rect x="-22" y="10" width="44" height="32" rx="5" fill="#EF3340"/>'
      +'<rect x="-22" y="22" width="44" height="4" fill="white" opacity="0.4"/>'
      +'<rect x="-38" y="12" width="17" height="10" rx="4" fill="#EF3340" transform="rotate(-15 -30 17)"/>'
      +'<rect x="21" y="12" width="17" height="10" rx="4" fill="#EF3340" transform="rotate(15 30 17)"/>'
      +'<ellipse cx="-28" cy="2" rx="6" ry="5" fill="#F5DEB3" transform="rotate(-15 -28 2)"/>'
      +'<ellipse cx="28" cy="2" rx="6" ry="5" fill="#F5DEB3" transform="rotate(15 28 2)"/>'
      +'<ellipse cx="0" cy="-12" rx="18" ry="20" fill="#F5DEB3"/>'
      +'<path d="M-17,-22 Q-16,-38 0,-40 Q16,-38 17,-22 Z" fill="#EF3340"/>'
      +'<rect x="-17" y="-26" width="34" height="5" fill="white" rx="2"/>'
      +'<circle cx="0" cy="-41" r="5" fill="white"/>'
      +'<ellipse cx="-7" cy="-14" rx="5" ry="6" fill="white"/>'
      +'<ellipse cx="7" cy="-14" rx="5" ry="6" fill="white"/>'
      +'<ellipse cx="-7" cy="-13" rx="3" ry="4" fill="#333"/>'
      +'<ellipse cx="7" cy="-13" rx="3" ry="4" fill="#333"/>'
      +'<ellipse cx="-7" cy="-13" rx="1.5" ry="2" fill="#111"><animate attributeName="cx" dur="1.5s" repeatCount="indefinite" values="-8;-6;-8"/></ellipse>'
      +'<ellipse cx="7" cy="-13" rx="1.5" ry="2" fill="#111"><animate attributeName="cx" dur="1.5s" repeatCount="indefinite" values="6;8;6"/></ellipse>'
      +'<ellipse cx="-7" cy="-14" rx="5" ry="6" fill="#F5DEB3" opacity="0"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;0;0;0;0;0;0;1;0"/></ellipse>'
      +'<ellipse cx="7" cy="-14" rx="5" ry="6" fill="#F5DEB3" opacity="0"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;0;0;0;0;0;0;1;0"/></ellipse>'
      +'<path d="M-8,0 Q0,2 8,0" fill="none" stroke="#a06050" stroke-width="2" stroke-linecap="round"><animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M-8,0 Q0,2 8,0;M-8,1 Q0,-1 8,1;M-8,0 Q0,2 8,0"/></path>'
      +'<ellipse cx="-20" cy="-5" rx="3" ry="4" fill="#88ccff" opacity="0"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0;0;1;0;0"/><animate attributeName="cy" dur="2s" repeatCount="indefinite" values="-5;-5;2;8;8"/></ellipse>'
      +'<ellipse cx="22" cy="-8" rx="3" ry="4" fill="#88ccff" opacity="0"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0;1;0;0;0" begin="1s"/><animate attributeName="cy" dur="2s" repeatCount="indefinite" values="-8;-1;5;5;5" begin="1s"/></ellipse>'
      +'</g>'
      +'<text x="200" y="122" text-anchor="middle" font-size="10" fill="#666" font-family="Arial,sans-serif">Venter pa straffer...</text>'
      +'</svg>';
  }
}

// Avatar SVGs
var avSVGs = {
  haaland:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">9</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,24 Q17,12 28,11 Q39,12 40,24 Q36,16 28,16 Q20,16 16,24Z" fill="#D4A355"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  odegaard:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">8</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  nusa:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">11</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#8B5A2B"/><path d="M16,27 Q15,11 28,10 Q41,11 40,27 Q37,17 28,17 Q19,17 16,27Z" fill="#1a0a00"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#3E2723"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#3E2723"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  nyland:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#FFD700"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="#003087" font-family="Arial,sans-serif">1</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#FFD700"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#FFD700"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q15,11 28,10 Q41,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#555"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  berge:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">23</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q15,11 28,10 Q41,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#333"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  sorloth:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">20</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5CBA7"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  bobb:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">22</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#6B3A1F"/><path d="M16,27 Q15,11 28,10 Q41,11 40,27 Q37,17 28,17 Q19,17 16,27Z" fill="#1a0a00"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#3E2723"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#3E2723"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  ajer:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="#EF3340"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="white" font-family="Arial,sans-serif">6</text><rect x="2" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="45" y="45" width="9" height="24" rx="3" fill="#EF3340"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q15,11 28,10 Q41,11 40,26 Q37,18 28,18 Q19,18 16,26Z" fill="#C8943A"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  messi:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="white" stroke="#ccc" stroke-width="1"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="#CF081F" font-family="Arial,sans-serif">10</text><rect x="2" y="45" width="9" height="24" rx="3" fill="white" stroke="#ccc" stroke-width="1"/><rect x="45" y="45" width="9" height="24" rx="3" fill="white" stroke="#ccc" stroke-width="1"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#8B5A2B"/><path d="M16,27 Q15,11 28,10 Q41,11 40,27 Q37,17 28,17 Q19,17 16,27Z" fill="#1a0a00"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#3E2723"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#3E2723"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>',
  alvarez:'<svg width="44" height="54" viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="42" width="36" height="34" rx="5" fill="white" stroke="#ccc" stroke-width="1"/><text x="28" y="57" text-anchor="middle" font-size="10" font-weight="900" fill="#CF081F" font-family="Arial,sans-serif">9</text><rect x="2" y="45" width="9" height="24" rx="3" fill="white" stroke="#ccc" stroke-width="1"/><rect x="45" y="45" width="9" height="24" rx="3" fill="white" stroke="#ccc" stroke-width="1"/><rect x="16" y="74" width="9" height="5" rx="2" fill="#222"/><rect x="31" y="74" width="9" height="5" rx="2" fill="#222"/><ellipse cx="28" cy="24" rx="13" ry="15" fill="#F5DEB3"/><path d="M16,26 Q16,11 28,10 Q40,11 40,26 Q37,17 28,17 Q19,17 16,26Z" fill="#8B6A34"/><ellipse cx="23" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><ellipse cx="33" cy="25" rx="2.2" ry="1.8" fill="#5D4037"/><path d="M24,31 Q28,34 32,31" fill="none" stroke="#C07060" stroke-width="1.2" stroke-linecap="round"/></svg>'
};

var medals=['🥇','🥈','🥉'];
var lbMode='total';
var teamFilter='';
var allEntries=[];

onValue(ref(db,'spain_argentina_entries'), function(snap) {
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
  var filterWrap = document.getElementById('teamFilterWrap');
  if (filterWrap) filterWrap.style.display = mode==='team' ? 'block' : 'none';
  renderLB();
};

window.setTeamFilter = function(val) {
  teamFilter = val;
  renderLB();
};

function populateTeamFilter() {
  var sel = document.getElementById('teamFilter');
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">-- Alle lag --</option>';
  var teams = [];
  allEntries.forEach(function(e) {
    if (e.team && teams.indexOf(e.team) < 0) teams.push(e.team);
  });
  teams.sort().forEach(function(t) {
    var opt = document.createElement('option');
    opt.value = t; opt.textContent = 'Lag: ' + t;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function renderLB() {
  var list=document.getElementById('lbList');
  var empty=document.getElementById('lbEmpty');
  if (!list) return;
  if (!allEntries.length) { list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';

  if (lbMode==='total') {
    var rows=allEntries.slice().sort(function(a,b){ return b.pts-a.pts; });
    renderRows(list, rows, function(e){ return (avNames[e.avatar]||'')+(e.team?' · Lag: '+e.team:''); });

  } else if (lbMode==='team') {
    // Show all players in selected team (or all if no filter), ranked by pts
    var filtered = teamFilter
      ? allEntries.filter(function(e){ return e.team===teamFilter; })
      : allEntries.slice();
    filtered.sort(function(a,b){ return b.pts-a.pts; });
    var label = teamFilter ? 'Lag: '+teamFilter : 'Alle lag';
    renderRows(list, filtered, function(e){ return (avNames[e.avatar]||'')+(e.team?' · Lag: '+e.team:'Ingen lag'); });
    document.getElementById('lb-info').textContent = label + ' - ' + filtered.length + ' deltakere - ' + new Date().toLocaleTimeString('no-NO');
    return;

  } else if (lbMode==='teamavg') {
    var teamTot={};
    allEntries.forEach(function(e){
      var t=e.team||'__ingen__';
      if(!teamTot[t]) teamTot[t]={team:t,total:0,count:0};
      teamTot[t].total+=e.pts; teamTot[t].count+=1;
    });
    var rows=Object.values(teamTot).map(function(t){
      return {name:t.team==='__ingen__'?'Ingen lag':'Lag: '+t.team,
              pts:Math.round(t.total/t.count*10)/10, count:t.count};
    }).sort(function(a,b){ return b.pts-a.pts; });
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

function renderRows(list, rows, subFn) {
  var maxPts=55;
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
      +'<div style="background:#003087;height:5px;width:'+bar+'%;border-radius:4px;"></div>'
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
    ['Spiller',avNames[e.avatar]||e.avatar],
    ['Lag',e.team||'-'],
    ['Hvem vinner',e.q1],
    ['Spansk ikke-argentinsk scorer',e.q_norscorer],
    ['Argentinsk-argentinsk scorer',e.q_engscorer],
    ['Argentinske kongelige pa TV',e.q_engroy],
    ['Spanske kongelige pa TV',e.q_norroy],
    ['Rekdal/Bohinen nevnt',e.q_rekdal],
    ['Spania opp i 2-0',e.q_2nil],
    ['Thatcher/Churchill nevnt',e.q_brit],
    ['Argentina bommer pa straffe',e.q_engpen],
    ['Resultat (full tid)',e.q3],
    ['Mal 1. omgang',e.q4],
    ['Gule kort',e.q5],
    ['Rott kort',e.q8],
    ['Ro nevnt',e.q_ro],
    ["It's coming home nevnt",e.q_home],
    ['Kampens 1. mal',e.q7==='0'?'Ingen mal':(e.q7?e.q7+'-'+(parseInt(e.q7)+9)+' min':'-')],
    ['Frispark',e.q10],
    ['Flo-pasninger',e.q11],
    ['Corners',e.q9],
    ['Innkast',e.q12],
    ['Skudd pa mal',e.q13],
    ['Poeng',e.pts+' pts'],
  ];
  body.innerHTML=rows.map(function(r){
    return '<div class="detail-row"><span class="detail-label">'+r[0]+': </span><span class="detail-val">'+(r[1]!==undefined?r[1]:'-')+'</span></div>';
  }).join('');
};
