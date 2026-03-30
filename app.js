// ===== DECORATIONS =====
(function(){
  const sc=document.getElementById('starsContainer');
  const cols=['#FFE08A','#FF6B9D','#C39BD3','#74BCFF','#ffffff'];
  for(let i=0;i<80;i++){const s=document.createElement('div');s.className='star';const sz=Math.random()*3+1,col=cols[Math.floor(Math.random()*cols.length)];s.style.cssText=`width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;background:${col};--d:${2+Math.random()*5}s;--delay:${Math.random()*6}s;`;sc.appendChild(s);}
  const pcols=['rgba(244,196,48,0.55)','rgba(255,107,157,0.45)','rgba(195,155,211,0.45)'];
  for(let i=0;i<18;i++){const p=document.createElement('div');p.className='particle';const sz=3+Math.random()*5;p.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}vw;background:${pcols[Math.floor(Math.random()*pcols.length)]};--dur:${7+Math.random()*10}s;--delay2:${Math.random()*10}s;`;document.body.appendChild(p);}
  const lw=document.getElementById('lanternWrap');
  const lc=['linear-gradient(135deg,#FF6B6B,#C0392B)','linear-gradient(135deg,#A29BFE,#6C5CE7)','linear-gradient(135deg,#FD9644,#E67E22)','linear-gradient(135deg,#FF8ECA,#E91E8C)','linear-gradient(135deg,#FFEAA7,#F4C430)','linear-gradient(135deg,#74B9FF,#0984E3)','linear-gradient(135deg,#FF6B6B,#C0392B)','linear-gradient(135deg,#55EFC4,#00B894)','linear-gradient(135deg,#FD9644,#E67E22)','linear-gradient(135deg,#A29BFE,#6C5CE7)'];
  for(let i=0;i<10;i++){const l=document.createElement('div');l.className='lantern';l.style.cssText=`background:${lc[i]};--sw:${2.5+Math.random()*2}s;--sd:${Math.random()*2}s;`;lw.appendChild(l);}
})();

// ===== STORAGE =====
const STORE_KEY='zawareh_plus_games';
function loadAllGames(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||[];}catch{return[];}}
function saveAllGames(g){try{localStorage.setItem(STORE_KEY,JSON.stringify(g));}catch(e){console.warn('Storage full',e);}}

// ===== STATE =====
const G={id:null,gameName:'زواره بلس',items:[],prizes:[],players:[],envelopes:[],envelopeCount:9,currentPlayerIdx:-1,currentEnvIdx:-1,scores:{},rouletteSpinning:false,prizeSpinning:false,rouletteAngle:0,prizeAngle:0,pendingNextAction:null,activePrizeList:[],lastWonPrize:null};
let tempMediaData=null,tempMediaType=null,tempAnswerMediaData=null,tempAnswerMediaType=null,optionRows=[],envCount=9,mcAnswered=false;

// ===== HELPERS =====
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
let _saveTimer=null;
function scheduleAutoSave(){clearTimeout(_saveTimer);_saveTimer=setTimeout(()=>{if(G.id)_doSave();},800);}

// ===== NAV =====
function goTo(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0);}

function startNewGame(){
  G.id='game_'+Date.now();G.gameName='زواره بلس';G.items=[];G.prizes=[];G.players=[];envCount=9;
  document.getElementById('gameNameInput').value='زواره بلس';document.getElementById('envCountDisplay').textContent=9;
  _syncNamePreview();loadDefaultPrizes();renderItems();renderPlayers();renderPrizePreview();
  optionRows=[];renderOptionRows();clearMedia();clearAnswerMedia();goTo('screenSetup');switchTab(1);
}

// ===== SAVED GAMES =====
function renderSavedGamesList(){
  const games=loadAllGames(),c=document.getElementById('savedGamesList');
  if(!games.length){c.innerHTML='<div class="alert alert-info" style="text-align:center;">لا توجد ألعاب محفوظة بعد. أنشئ لعبتك الأولى! 🎮</div>';return;}
  c.innerHTML=games.map(g=>`<div class="saved-game-card" onclick="loadGame('${g.id}')"><div class="saved-game-icon">🎮</div><div class="saved-game-info"><div class="saved-game-name">${escHtml(g.gameName)}</div><div class="saved-game-meta">${(g.items||[]).length} سؤال/تحدي • ${(g.prizes||[]).length} جائزة • ${g.lastSaved||'—'}</div></div><div class="saved-game-actions" onclick="event.stopPropagation()"><button class="btn btn-gold btn-sm" onclick="loadGame('${g.id}')">▶ تشغيل</button><button class="btn btn-ghost btn-sm" onclick="editGame('${g.id}')">✏️</button><button class="btn btn-red btn-sm" onclick="deleteGame('${g.id}')">🗑️</button></div></div>`).join('');
}

function _doSave(){
  document.querySelectorAll('.prize-name-input').forEach(inp=>{const i=parseInt(inp.dataset.idx);if(G.prizes[i]!==undefined)G.prizes[i].name=inp.value;});
  document.querySelectorAll('.prize-qty').forEach(inp=>{const i=parseInt(inp.dataset.idx);if(G.prizes[i]!==undefined)G.prizes[i].qty=parseInt(inp.value)||1;});
  const games=loadAllGames(),idx=games.findIndex(g=>g.id===G.id);
  const rec={id:G.id,gameName:G.gameName,items:G.items,prizes:G.prizes,envelopeCount:envCount,lastSaved:new Date().toLocaleDateString('ar-SA')};
  if(idx>=0)games[idx]=rec;else games.push(rec);saveAllGames(games);
}
function saveCurrentGame(){_doSave();const btn=document.getElementById('saveBtn');if(btn){btn.textContent='✅ تم الحفظ!';setTimeout(()=>{btn.innerHTML='💾 حفظ';},2000);}}

function _applyGame(g){
  G.id=g.id;G.gameName=g.gameName;G.items=g.items||[];G.prizes=g.prizes||[];
  envCount=g.envelopeCount||9;document.getElementById('gameNameInput').value=G.gameName;document.getElementById('envCountDisplay').textContent=envCount;
  _syncNamePreview();renderItems();renderPlayers();renderPrizePreview();optionRows=[];renderOptionRows();clearMedia();clearAnswerMedia();
}
function loadGame(id){const g=loadAllGames().find(x=>x.id===id);if(!g)return;_applyGame(g);goTo('screenSetup');switchTab(3);}
function editGame(id){const g=loadAllGames().find(x=>x.id===id);if(!g)return;_applyGame(g);goTo('screenSetup');switchTab(1);}
function deleteGame(id){if(!confirm('حذف هذه اللعبة؟'))return;saveAllGames(loadAllGames().filter(g=>g.id!==id));renderSavedGamesList();}

// ===== GAME NAME =====
function _syncNamePreview(){document.getElementById('gameNamePreview').textContent=G.gameName;}
function updateGameNamePreview(){G.gameName=document.getElementById('gameNameInput').value||'زواره بلس';_syncNamePreview();scheduleAutoSave();}
function setGameName(n){document.getElementById('gameNameInput').value=n;updateGameNamePreview();}

// ===== TABS =====
function switchTab(n){
  [1,2,3].forEach(i=>{
    document.getElementById('tab'+i).classList.toggle('hidden',i!==n);
    document.getElementById('tab'+i+'btn').classList.toggle('active',i===n);
    const d=document.getElementById('sd'+i);d.classList.toggle('active',i===n);d.classList.toggle('done',i<n);
  });
  if(n===2){buildPrizeRows();renderPrizePreview();}
  if(n===3)updateSummary();
}

// ===== OPTIONS =====
function addOptionRow(val,correct){optionRows.push({text:val||'',correct:correct||false});renderOptionRows();}
function renderOptionRows(){
  const letters=['أ','ب','ج','د','هـ'];
  document.getElementById('optionsList').innerHTML=optionRows.map((o,i)=>`<div class="option-row"><button class="option-correct-toggle ${o.correct?'correct':''}" onclick="toggleCorrectOption(${i})">✓</button><input type="text" placeholder="خيار ${letters[i]||i+1}" value="${escHtml(o.text)}" oninput="optionRows[${i}].text=this.value"><button class="btn btn-sm" style="background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.25);color:#FF8A8A;padding:8px 12px;" onclick="removeOptionRow(${i})">✕</button></div>`).join('');
}
function toggleCorrectOption(i){optionRows[i].correct=!optionRows[i].correct;renderOptionRows();}
function removeOptionRow(i){optionRows.splice(i,1);renderOptionRows();}

// ===== MEDIA =====
function handleMediaUpload(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{tempMediaData=ev.target.result;tempMediaType=file.type.startsWith('video/')?'video':'image';document.getElementById('mediaUploadPrompt').style.display='none';const p=document.getElementById('mediaPreviewArea');p.classList.remove('hidden');p.innerHTML=tempMediaType==='video'?`<video src="${tempMediaData}" controls style="width:100%;max-height:160px;border-radius:10px;"></video>`:`<img src="${tempMediaData}" style="width:100%;max-height:160px;object-fit:contain;border-radius:10px;">`;document.getElementById('clearMediaBtn').style.display='inline-flex';};r.readAsDataURL(file);}
function clearMedia(){tempMediaData=null;tempMediaType=null;document.getElementById('mediaFileInput').value='';document.getElementById('mediaPreviewArea').classList.add('hidden');document.getElementById('mediaPreviewArea').innerHTML='';document.getElementById('mediaUploadPrompt').style.display='block';document.getElementById('clearMediaBtn').style.display='none';}
function handleAnswerMediaUpload(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{tempAnswerMediaData=ev.target.result;tempAnswerMediaType=file.type.startsWith('video/')?'video':'image';document.getElementById('answerMediaUploadPrompt').style.display='none';const p=document.getElementById('answerMediaPreviewArea');p.classList.remove('hidden');p.innerHTML=tempAnswerMediaType==='video'?`<video src="${tempAnswerMediaData}" controls style="width:100%;max-height:160px;border-radius:10px;"></video>`:`<img src="${tempAnswerMediaData}" style="width:100%;max-height:160px;object-fit:contain;border-radius:10px;">`;document.getElementById('clearAnswerMediaBtn').style.display='inline-flex';};r.readAsDataURL(file);}
function clearAnswerMedia(){tempAnswerMediaData=null;tempAnswerMediaType=null;document.getElementById('answerMediaFileInput').value='';document.getElementById('answerMediaPreviewArea').classList.add('hidden');document.getElementById('answerMediaPreviewArea').innerHTML='';document.getElementById('answerMediaUploadPrompt').style.display='block';document.getElementById('clearAnswerMediaBtn').style.display='none';}

// ===== ITEMS =====
function addItem(){
  const txt=document.getElementById('itemText').value.trim();if(!txt){alert('يرجى كتابة نص السؤال أو التحدي');return;}
  const type=document.getElementById('itemType').value,answer=document.getElementById('itemAnswer').value.trim();
  const options=optionRows.filter(o=>o.text.trim()).map(o=>({text:o.text.trim(),correct:o.correct}));
  G.items.push({type,text:txt,answer,options,mediaData:tempMediaData,mediaType:tempMediaType,answerMediaData:tempAnswerMediaData,answerMediaType:tempAnswerMediaType});
  document.getElementById('itemText').value='';document.getElementById('itemAnswer').value='';
  optionRows=[];renderOptionRows();clearMedia();clearAnswerMedia();renderItems();scheduleAutoSave();
}
function removeItem(i){G.items.splice(i,1);renderItems();scheduleAutoSave();}
function renderItems(){
  document.getElementById('itemCount').textContent=G.items.length;
  document.getElementById('itemList').innerHTML=G.items.map((item,i)=>`<div class="item-tag"><span class="item-tag-type">${item.type==='q'?'❓':'🎯'}</span><div class="item-tag-body"><div class="item-tag-text">${escHtml(item.text)}</div><div class="item-tag-meta">${item.answer?`<span style="color:#55ff99;">✓ ${escHtml(item.answer)}</span>`:''}${item.options&&item.options.length?`<span style="color:#74BCFF;">🔤 ${item.options.length} خيارات</span>`:''}${item.mediaData?`<span style="color:#FD9644;">${item.mediaType==='video'?'🎬':'🖼️'}</span>`:''}${item.answerMediaData?`<span style="color:#A29BFE;">${item.answerMediaType==='video'?'🎬✅':'🖼️✅'}</span>`:''}</div></div><button class="remove" onclick="removeItem(${i})">✕</button></div>`).join('');
}
function clearItems(){G.items=[];renderItems();scheduleAutoSave();}
const DEF_ITEMS=[
  {type:'q',text:'ما هو الشهر الكريم الذي يصوم فيه المسلمون؟',answer:'رمضان',options:[{text:'رجب',correct:false},{text:'رمضان',correct:true},{text:'شعبان',correct:false},{text:'شوال',correct:false}],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'q',text:'كم عدد ركعات صلاة العيد؟',answer:'ركعتان',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'q',text:'ما معنى "فطر" في عيد الفطر؟',answer:'الإفطار بعد الصوم',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'q',text:'ما هي أشهر أطعمة العيد عندكم؟',answer:'',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'q',text:'في أي وقت تُصلى صلاة العيد؟',answer:'بعد شروق الشمس',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'c',text:'قل 5 أسماء أكلات العيد في 10 ثوانٍ!',answer:'',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'c',text:'قلّد شخصاً يستلم عيدية صغيرة ويتظاهر أنها كبيرة!',answer:'',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'c',text:'اذكر 5 أفراد من عائلتك وصف كل واحد بكلمة!',answer:'',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
  {type:'c',text:'غنّ أي أغنية للعيد بصوت عالٍ لـ5 ثوانٍ!',answer:'',options:[],mediaData:null,mediaType:null,answerMediaData:null,answerMediaType:null},
];
function loadDefaults(){G.items=DEF_ITEMS.map(i=>({...i,options:[...i.options]}));renderItems();scheduleAutoSave();}

// ===== ENV COUNT =====
function changeEnvCount(d){envCount=Math.max(3,Math.min(30,envCount+d));envCount=Math.round(envCount/3)*3;document.getElementById('envCountDisplay').textContent=envCount;}

// =====================================================================
// PRIZES — FIXED: no DOM rebuild on typing, only on blur/structural changes
// =====================================================================
const DEF_PRIZES=[
  {name:'ككاو 🍫',qty:3,dependsOn:''},
  {name:'كرت شحن 💳',qty:2,dependsOn:''},
  {name:'عيدية خاصة 💰',qty:1,dependsOn:''},
  {name:'  بوق العيديه🎉',qty:1,dependsOn:'عيدية خاصة 💰'},
  {name:'لعبة صغيرة 🎮',qty:2,dependsOn:''},
  {name:'حلاو 🍬',qty:4,dependsOn:''},
  {name:'جائزة مفاجأة 🎁',qty:1,dependsOn:'لعبة صغيرة 🎮'},
  {name:'نقطة ذهبية ⭐',qty:3,dependsOn:''},
];
function loadDefaultPrizes(){G.prizes=DEF_PRIZES.map(p=>({...p}));if(document.getElementById('prizeInputs'))buildPrizeRows();renderPrizePreview();}

function buildPrizeRows(){
  const c=document.getElementById('prizeInputs');if(!c)return;
  c.innerHTML='';G.prizes.forEach((p,i)=>_appendPrizeRow(p,i));
}

function _appendPrizeRow(p,idx){
  const c=document.getElementById('prizeInputs');
  const allNames=G.prizes.map(x=>x.name).filter(n=>n);
  const depOpts=allNames.filter(n=>n!==p.name).map(n=>`<option value="${escHtml(n)}" ${p.dependsOn===n?'selected':''}>${escHtml(n)}</option>`).join('');
  const row=document.createElement('div');
  row.className='prize-row';row.dataset.idx=idx;
  row.style.cssText='display:grid;grid-template-columns:1fr 70px 1fr 44px;gap:8px;margin-bottom:10px;align-items:center;';
  row.innerHTML=`<input type="text" class="prize-name-input" data-idx="${idx}" placeholder="اسم الجائزة" value="${escHtml(p.name)}"><input type="number" class="prize-qty" data-idx="${idx}" min="1" max="99" value="${p.qty}" style="text-align:center;"><select class="dep-select" data-idx="${idx}"><option value="" ${!p.dependsOn?'selected':''}>— لا يعتمد —</option>${depOpts}</select><button class="btn btn-red btn-sm" style="padding:10px 12px;" onclick="removePrize(${idx})">✕</button>`;

  // NAME: update state on input (NO DOM rebuild = no focus loss)
  row.querySelector('.prize-name-input').addEventListener('input',function(){
    G.prizes[idx].name=this.value;renderPrizePreview();scheduleAutoSave();
  });
  // NAME blur: only refresh dependency dropdowns (doesn't touch inputs)
  row.querySelector('.prize-name-input').addEventListener('blur',()=>{
    _refreshDepDropdowns();scheduleAutoSave();
  });

  // QTY: update state on input
  row.querySelector('.prize-qty').addEventListener('input',function(){
    G.prizes[idx].qty=parseInt(this.value)||1;renderPrizePreview();scheduleAutoSave();
  });

  // DEP: update state on change
  row.querySelector('.dep-select').addEventListener('change',function(){
    G.prizes[idx].dependsOn=this.value;renderPrizePreview();scheduleAutoSave();
  });

  c.appendChild(row);
}

// Only refreshes <select> options — never touches name/qty inputs → focus safe
function _refreshDepDropdowns(){
  const allNames=G.prizes.map(p=>p.name).filter(n=>n);
  document.querySelectorAll('.prize-row').forEach(row=>{
    const idx=parseInt(row.dataset.idx);if(!G.prizes[idx])return;
    const dep=G.prizes[idx].dependsOn||'',curName=G.prizes[idx].name||'';
    const opts=allNames.filter(n=>n!==curName).map(n=>`<option value="${escHtml(n)}" ${dep===n?'selected':''}>${escHtml(n)}</option>`).join('');
    const sel=row.querySelector('.dep-select');
    sel.innerHTML=`<option value="" ${!dep?'selected':''}>— لا يعتمد —</option>${opts}`;
    sel.value=dep;
  });
}

function addPrizeRow(){G.prizes.push({name:'',qty:1,dependsOn:''});buildPrizeRows();renderPrizePreview();}
function removePrize(idx){
  const removed=G.prizes[idx]?G.prizes[idx].name:'';
  G.prizes.splice(idx,1);G.prizes.forEach(p=>{if(p.dependsOn===removed)p.dependsOn='';});
  buildPrizeRows();renderPrizePreview();scheduleAutoSave();
}
function renderPrizePreview(){
  const el=document.getElementById('prizePreview');if(!el)return;
  el.innerHTML=G.prizes.filter(p=>p.name).map(p=>{
    const locked=p.dependsOn&&p.dependsOn!=='';
    return`<div class="prize-pill ${locked?'locked':'available'}"><span>${escHtml(p.name)}</span><span class="qty">×${p.qty}</span>${locked?`<span style="font-size:0.7rem;color:rgba(155,89,182,0.8);">🔒 بعد: ${escHtml(p.dependsOn)}</span>`:''}</div>`;
  }).join('');
}

// ===== PLAYERS =====
function addPlayer(){const inp=document.getElementById('playerInput'),name=inp.value.trim();if(!name||G.players.find(p=>p.name===name)){inp.value='';return;}G.players.push({name,num:0,score:0});inp.value='';renderPlayers();}
function removePlayer(i){G.players.splice(i,1);renderPlayers();}
function renderPlayers(){document.getElementById('playersList').innerHTML=G.players.map((p,i)=>`<div class="player-badge"><div class="player-num">${i+1}</div><span style="flex:1;font-weight:600;">${escHtml(p.name)}</span><button onclick="removePlayer(${i})" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:1rem;">✕</button></div>`).join('');}
function addDefaultPlayers(){['سارة','أحمد','محمد','نورة','خالد','فاطمة'].forEach(n=>{if(!G.players.find(p=>p.name===n))G.players.push({name:n,num:0,score:0});});renderPlayers();}
function updateSummary(){document.getElementById('summaryGrid').innerHTML=`<div class="sum-item"><div class="sum-val" style="color:${G.items.length>0?'var(--gold)':'#FF8A8A'}">${G.items.length}</div><div class="sum-label">أسئلة وتحديات</div></div><div class="sum-item"><div class="sum-val" style="color:${G.players.length>=2?'var(--gold)':'#FF8A8A'}">${G.players.length}</div><div class="sum-label">لاعبون</div></div><div class="sum-item"><div class="sum-val">${envCount}</div><div class="sum-label">ظرف</div></div><div class="sum-item"><div class="sum-val">${G.prizes.filter(p=>p.name).length}</div><div class="sum-label">جائزة</div></div>`;}

// ===== START GAME =====
function startGame(){
  if(G.players.length<2){alert('يرجى إضافة لاعبين (الحد الأدنى 2)');return;}
  if(G.items.length===0)loadDefaults();
  if(G.prizes.filter(p=>p.name).length===0)loadDefaultPrizes();
  // Sync live inputs
  document.querySelectorAll('.prize-name-input').forEach(inp=>{const i=parseInt(inp.dataset.idx);if(G.prizes[i])G.prizes[i].name=inp.value;});
  document.querySelectorAll('.prize-qty').forEach(inp=>{const i=parseInt(inp.dataset.idx);if(G.prizes[i])G.prizes[i].qty=parseInt(inp.value)||1;});
  G.gameName=document.getElementById('gameNameInput').value||'زواره بلس';
  document.getElementById('gameHeaderTitle').textContent=G.gameName+' 🎊';
  document.getElementById('welcomeTitle').textContent=G.gameName;
  G.envelopeCount=envCount;
  const nums=shuffle([...Array(G.players.length).keys()].map(i=>i+1));
  G.players.forEach((p,i)=>{p.num=nums[i];p.score=0;});
  G.scores={};G.players.forEach(p=>G.scores[p.name]=0);
  G.activePrizeList=G.prizes.filter(p=>p.name).map(p=>({name:p.name,remaining:Math.max(1,p.qty||1),dependsOn:p.dependsOn||'',unlocked:!p.dependsOn}));
  G.lastWonPrize=null;
  buildEnvelopes();goTo('screenGame');updateGameInfo();initRoulette();setPhase('roulette');_doSave();
}

function buildEnvelopes(){
  const pool=[...G.items];while(pool.length<G.envelopeCount)pool.push(...G.items);shuffle(pool);
  const colors=['ec1','ec2','ec3','ec4','ec5','ec6','ec7','ec8','ec9'];G.envelopes=[];
  for(let i=0;i<G.envelopeCount;i++)G.envelopes.push({...pool[i%pool.length],opened:false,color:colors[i%colors.length]});
}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

function setPhase(ph){
  G.phase=ph;
  document.getElementById('phaseRoulette').classList.toggle('hidden',ph!=='roulette');
  document.getElementById('phaseEnvelopes').classList.toggle('hidden',ph!=='envelopes');
  document.getElementById('phasePrize').classList.toggle('hidden',ph!=='prize');
  window.scrollTo(0,0);
}
function updateGameInfo(){const opened=G.envelopes.filter(e=>e.opened).length;document.getElementById('envsLeft').textContent=G.envelopeCount-opened;document.getElementById('playersCount').textContent=G.players.length;document.getElementById('gameProgress').style.width=((opened/G.envelopeCount)*100)+'%';}

// ===== ROULETTE =====
function initRoulette(){drawRoulette(G.rouletteAngle);document.getElementById('spinResult').classList.add('hidden');document.getElementById('rouletteBtn').innerHTML='<button class="btn btn-gold btn-xl" onclick="spinRoulette()">🎡 دوّر الروليت!</button>';}
function lighten(hex,pct){const n=parseInt(hex.replace('#',''),16);return`rgb(${Math.min(255,((n>>16)&0xff)+pct)},${Math.min(255,((n>>8)&0xff)+pct)},${Math.min(255,(n&0xff)+pct)})`;}
function drawRoulette(angle){
  const cv=document.getElementById('roulette-canvas'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,cx=W/2,cy=H/2,r=W/2-12;ctx.clearRect(0,0,W,H);
  const n=G.players.length,sa=(2*Math.PI)/n;
  const cols=['#FF6B6B','#A29BFE','#FD9644','#FF8ECA','#FFEAA7','#74B9FF','#FF7B7B','#55EFC4','#FD9644','#C39BD3'];
  for(let i=0;i<n;i++){
    const s=angle+i*sa-Math.PI/2,e=s+sa;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();
    const grd=ctx.createRadialGradient(cx,cy,r*0.25,cx,cy,r);grd.addColorStop(0,lighten(cols[i%cols.length],28));grd.addColorStop(1,cols[i%cols.length]);
    ctx.fillStyle=grd;ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.22)';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(s+sa/2);ctx.textAlign='right';ctx.fillStyle='white';ctx.font=`bold ${Math.max(10,17-Math.floor(n/2))}px Tajawal`;ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=5;ctx.fillText(`${G.players[i].name} (${G.players[i].num})`,r-12,5);ctx.restore();
  }
  ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.strokeStyle='rgba(244,196,48,0.7)';ctx.lineWidth=4;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,26,0,2*Math.PI);const cg=ctx.createRadialGradient(cx-5,cy-5,2,cx,cy,26);cg.addColorStop(0,'#3D1A6E');cg.addColorStop(1,'#1A0A2E');ctx.fillStyle=cg;ctx.fill();ctx.strokeStyle='rgba(244,196,48,0.9)';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#F4C430';ctx.font='15px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎡',cx,cy);
  ctx.save();ctx.translate(cx,cy-r+5);ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(11,0);ctx.lineTo(0,28);ctx.closePath();ctx.fillStyle='#F4C430';ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.45)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function spinRoulette(){
  if(G.rouletteSpinning)return;
  const opened=G.envelopes.filter(e=>e.opened).length;if(opened>=G.envelopeCount){endGame();return;}
  G.rouletteSpinning=true;document.getElementById('spinResult').classList.add('hidden');
  document.getElementById('rouletteBtn').innerHTML='<div style="font-size:0.95rem;color:rgba(255,255,255,0.35);text-align:center;padding:10px;">جاري الدوران...</div>';
  const extra=(5+Math.floor(Math.random()*6))*2*Math.PI,target=G.rouletteAngle+extra+Math.random()*2*Math.PI;
  const dur=3500,t0=performance.now(),a0=G.rouletteAngle;
  function anim(now){
    const el=now-t0,t=Math.min(el/dur,1),ease=1-Math.pow(1-t,3);G.rouletteAngle=a0+(target-a0)*ease;drawRoulette(G.rouletteAngle);
    if(t<1){requestAnimationFrame(anim);return;}
    G.rouletteSpinning=false;
    const n=G.players.length,sa=(2*Math.PI)/n;
    const na=((G.rouletteAngle%(2*Math.PI))+(2*Math.PI))%(2*Math.PI);
    const idx=Math.floor(((2*Math.PI-na)%(2*Math.PI))/sa)%n;
    G.currentPlayerIdx=idx;const player=G.players[idx];
    const res=document.getElementById('spinResult');res.textContent=`🎉 ${player.name} — رقم ${player.num}`;res.classList.remove('hidden');
    document.getElementById('rouletteBtn').innerHTML=`<button class="btn btn-pink btn-xl" onclick="goToEnvelopes()">اختر ظرفك يا ${player.name}! ✉️</button>`;
  }
  requestAnimationFrame(anim);
}
function goToEnvelopes(){
  const p=G.players[G.currentPlayerIdx];
  document.getElementById('activePlayerName').textContent=p.name;document.getElementById('activePlayerNum').textContent=`رقم ${p.num}`;
  renderEnvelopes();setPhase('envelopes');
}

// ===== SVG ENVELOPES =====
const ENV_THEMES=[['#C0392B','#E74C3C','#922B21'],['#1A8C87','#4ECDC4','#0E6B67'],['#6C5CE7','#A29BFE','#4A3AA8'],['#A04000','#E67E22','#784212'],['#880E4F','#E91E8C','#5C0835'],['#8C6000','#F4C430','#5A3E00'],['#1565C0','#1E90FF','#0D47A1'],['#00695C','#26A69A','#004D40'],['#7F0000','#FF4757','#5C0000']];
function makeEnvelopeSVG(theme,num,isOpen,icon){
  const [body,flap,shadow]=ENV_THEMES[theme%ENV_THEMES.length],W=180,H=135;
  if(isOpen)return`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="20" width="${W-4}" height="${H-24}" rx="8" fill="${body}"/><rect x="2" y="20" width="${W-4}" height="${H-24}" rx="8" fill="rgba(0,0,0,0.15)"/><line x1="2" y1="20" x2="${W/2}" y2="${H-20}" stroke="${shadow}" stroke-width="1.5" opacity="0.4"/><line x1="${W-2}" y1="20" x2="${W/2}" y2="${H-20}" stroke="${shadow}" stroke-width="1.5" opacity="0.4"/><text x="${W/2}" y="${H/2+16}" text-anchor="middle" font-size="30" font-family="serif">${icon}</text></svg>`;
  return`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;"><rect x="6" y="24" width="${W-8}" height="${H-28}" rx="10" fill="rgba(0,0,0,0.35)"/><rect x="2" y="20" width="${W-4}" height="${H-22}" rx="10" fill="${body}"/><line x1="2" y1="${H-2}" x2="${W/2}" y2="${H/2+8}" stroke="${shadow}" stroke-width="1.5" opacity="0.5"/><line x1="${W-2}" y1="${H-2}" x2="${W/2}" y2="${H/2+8}" stroke="${shadow}" stroke-width="1.5" opacity="0.5"/><line x1="2" y1="20" x2="${W/2}" y2="${H/2+8}" stroke="${shadow}" stroke-width="1.2" opacity="0.4"/><line x1="${W-2}" y1="20" x2="${W/2}" y2="${H/2+8}" stroke="${shadow}" stroke-width="1.2" opacity="0.4"/><polygon points="2,22 ${W/2},${H/2-6} ${W-2},22" fill="${flap}"/><polygon points="2,22 ${W/2},${H/2-6} ${W-2},22" fill="rgba(0,0,0,0.12)"/><line x1="2" y1="22" x2="${W/2}" y2="${H/2-6}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><line x1="${W-2}" y1="22" x2="${W/2}" y2="${H/2-6}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><circle cx="${W/2}" cy="${H/2+10}" r="18" fill="${flap}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/><circle cx="${W/2}" cy="${H/2+10}" r="12" fill="${shadow}" opacity="0.4"/><text x="${W/2}" y="${H/2+15}" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.85)" font-family="serif">✦</text><circle cx="${W-20}" cy="${H-14}" r="13" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/><text x="${W-20}" y="${H-10}" text-anchor="middle" font-size="11" font-weight="bold" fill="white" font-family="Tajawal,sans-serif">${num}</text><rect x="2" y="20" width="${W-4}" height="28" rx="10" fill="rgba(255,255,255,0.08)"/></svg>`;
}
function renderEnvelopes(){
  document.getElementById('envelopesGrid').innerHTML=G.envelopes.map((env,i)=>{
    const svg=env.opened?makeEnvelopeSVG(i,i+1,true,env.type==='q'?'❓':'🎯'):makeEnvelopeSVG(i,i+1,false,'');
    const click=env.opened?'':('openEnvelope('+i+')');
    return`<div class="envelope ${env.opened?'opened':''}" onclick="${click}" style="animation-delay:${i*0.055}s">${svg}</div>`;
  }).join('');
}

// ===== MODAL =====
function openEnvelope(i){
  const env=G.envelopes[i];if(env.opened)return;G.currentEnvIdx=i;mcAnswered=false;
  document.getElementById('modalIcon').textContent=env.type==='q'?'❓':'🎯';
  document.getElementById('modalTitle').textContent=env.type==='q'?'❓ سؤال':'🎯 تحدي';
  document.getElementById('modalBadge').textContent=env.type==='q'?'سؤال':'تحدي';
  document.getElementById('modalBadge').className='modal-type-badge '+(env.type==='q'?'badge-q':'badge-c');
  document.getElementById('modalQuestion').textContent=env.text;
  const media=document.getElementById('modalMedia');
  if(env.mediaData){media.classList.remove('hidden');media.innerHTML=env.mediaType==='video'?`<video src="${env.mediaData}" controls style="width:100%;max-height:260px;border-radius:14px;"></video>`:`<img src="${env.mediaData}" style="width:100%;max-height:260px;object-fit:contain;border-radius:14px;">`;}
  else{media.classList.add('hidden');media.innerHTML='';}
  const optDiv=document.getElementById('modalOptions'),letters=['أ','ب','ج','د','هـ'];
  if(env.options&&env.options.length){optDiv.classList.remove('hidden');optDiv.innerHTML=env.options.map((o,idx)=>`<button class="mc-option" id="mcOpt${idx}" onclick="selectMCOption(${idx},${o.correct})"><span class="mc-letter">${letters[idx]||idx+1}</span><span>${escHtml(o.text)}</span></button>`).join('');}
  else{optDiv.classList.add('hidden');optDiv.innerHTML='';}
  const revDiv=document.getElementById('answerReveal');revDiv.classList.remove('show');revDiv.style.display='none';
  const ansMedia=document.getElementById('answerRevealMedia');ansMedia.classList.add('hidden');ansMedia.innerHTML='';
  if(env.answer||env.answerMediaData){
    document.getElementById('answerRevealText').textContent=env.answer||'';
    if(env.answerMediaData){ansMedia.innerHTML=env.answerMediaType==='video'?`<video src="${env.answerMediaData}" controls style="width:100%;max-height:240px;border-radius:12px;margin-top:6px;"></video>`:`<img src="${env.answerMediaData}" style="width:100%;max-height:240px;object-fit:contain;border-radius:12px;margin-top:6px;">`;}
    document.getElementById('showAnswerBtn').classList.remove('hidden');
  }else{document.getElementById('showAnswerBtn').classList.add('hidden');}
  document.getElementById('correctBtn').disabled=false;document.getElementById('wrongBtn').disabled=false;
  document.getElementById('correctBtn').style.boxShadow='';document.getElementById('wrongBtn').style.boxShadow='';
  document.getElementById('cardModal').classList.add('open');
}
function selectMCOption(idx,isCorrect){
  if(mcAnswered)return;mcAnswered=true;
  const opts=document.querySelectorAll('.mc-option');opts[idx].classList.add(isCorrect?'selected-correct':'selected-wrong');
  opts.forEach((el,i)=>{if(G.envelopes[G.currentEnvIdx].options[i].correct&&i!==idx)el.classList.add('reveal-correct');});
  if(isCorrect)document.getElementById('correctBtn').style.boxShadow='0 0 20px rgba(0,230,118,0.6)';
  else{document.getElementById('wrongBtn').style.boxShadow='0 0 20px rgba(255,71,87,0.6)';revealAnswer();}
}
function revealAnswer(){
  const d=document.getElementById('answerReveal');d.style.display='block';d.classList.add('show');
  const m=document.getElementById('answerRevealMedia');if(m.innerHTML.trim())m.classList.remove('hidden');
}
function handleAnswer(correct){
  document.getElementById('cardModal').classList.remove('open');mcAnswered=false;
  document.getElementById('correctBtn').style.boxShadow='';document.getElementById('wrongBtn').style.boxShadow='';
  G.envelopes[G.currentEnvIdx].opened=true;updateGameInfo();
  const player=G.players[G.currentPlayerIdx],opened=G.envelopes.filter(e=>e.opened).length;
  if(correct){
    G.scores[player.name]=(G.scores[player.name]||0)+1;
    document.getElementById('prizePlayerName').textContent=player.name;
    updatePrizeWheelUnlocks();G.prizeSpinning=false;drawPrizeWheel(G.prizeAngle);
    document.getElementById('prizeBtn').innerHTML='<button class="btn btn-gold btn-xl" onclick="spinPrizeWheel()">🎁 دوّر دوامة الجوائز!</button>';
    setPhase('prize');renderPrizePills();
  }else{
    if(opened>=G.envelopeCount)endGame();else showWrongAndRoulette(player.name);
  }
}
function showWrongAndRoulette(name){
  setPhase('roulette');const old=document.getElementById('wrongBanner');if(old)old.remove();
  const b=document.createElement('div');b.id='wrongBanner';b.className='wrong-turn-banner';
  b.innerHTML=`<span class="wtb-icon">❌</span><div class="wtb-title">انتهى دور ${escHtml(name)}!</div><div class="wtb-sub">أجاب خطأ — سيعود عند دوران الروليت مجدداً</div>`;
  document.getElementById('phaseRoulette').insertBefore(b,document.getElementById('phaseRoulette').firstChild);
  document.getElementById('spinResult').classList.add('hidden');
  document.getElementById('rouletteBtn').innerHTML='<button class="btn btn-gold btn-xl" onclick="spinRoulette()">🎡 دوّر الروليت!</button>';
}

// ===== PRIZE WHEEL =====
function updatePrizeWheelUnlocks(){G.activePrizeList.forEach(p=>{if(!p.unlocked&&p.dependsOn&&p.dependsOn===G.lastWonPrize)p.unlocked=true;});}
function getWheelPrizes(){return G.activePrizeList.filter(p=>p.unlocked&&p.remaining>0);}
function renderPrizePills(){
  const el=document.getElementById('prizePills');if(!el)return;
  el.innerHTML=G.activePrizeList.map(p=>`<div class="prize-pill ${p.remaining<=0?'exhausted':p.unlocked?'available':'locked'}"><span>${escHtml(p.name)}</span><span class="qty">${p.remaining>0?'×'+p.remaining:'نفد'}</span>${!p.unlocked?'<span style="font-size:0.7rem;">🔒</span>':''}</div>`).join('');
}
function drawPrizeWheel(angle){
  const cv=document.getElementById('prize-canvas'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,cx=W/2,cy=H/2,r=W/2-12;ctx.clearRect(0,0,W,H);
  const wp=getWheelPrizes();
  if(!wp.length){ctx.fillStyle='rgba(255,255,255,0.08)';ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fill();ctx.fillStyle='white';ctx.font='bold 16px Tajawal';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('نفدت الجوائز 😅',cx,cy);return;}
  const n=wp.length,sa=(2*Math.PI)/n;
  const cols=['#FF6B6B','#F4C430','#A29BFE','#74B9FF','#FF8ECA','#FD9644','#55EFC4','#C39BD3','#FF4757','#4ECDC4'];
  for(let i=0;i<n;i++){
    const s=angle+i*sa-Math.PI/2,e=s+sa;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();
    const grd=ctx.createRadialGradient(cx,cy,r*0.25,cx,cy,r);grd.addColorStop(0,lighten(cols[i%cols.length],22));grd.addColorStop(1,cols[i%cols.length]);
    ctx.fillStyle=grd;ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(s+sa/2);ctx.textAlign='right';ctx.fillStyle='white';ctx.font=`bold ${Math.max(10,15-Math.floor(n/4))}px Tajawal`;ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=5;
    const label=wp[i].name.length>13?wp[i].name.substring(0,12)+'…':wp[i].name;ctx.fillText(`${label} (${wp[i].remaining})`,r-10,5);ctx.restore();
  }
  ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.strokeStyle='rgba(255,107,157,0.8)';ctx.lineWidth=5;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,28,0,2*Math.PI);const cg=ctx.createRadialGradient(cx-6,cy-6,2,cx,cy,28);cg.addColorStop(0,'#3D1A6E');cg.addColorStop(1,'#1A0A2E');ctx.fillStyle=cg;ctx.fill();ctx.strokeStyle='rgba(255,107,157,0.9)';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#FFD700';ctx.font='17px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎁',cx,cy);
  ctx.save();ctx.translate(cx,cy-r+5);ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.lineTo(0,30);ctx.closePath();ctx.fillStyle='#FF6B9D';ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function spinPrizeWheel(){
  if(G.prizeSpinning)return;const wheel=getWheelPrizes();
  if(!wheel.length){showPrizeCelebration('😅 نفدت الجوائز!',false,false);return;}
  G.prizeSpinning=true;document.getElementById('prizeBtn').innerHTML='<div style="font-size:0.95rem;color:rgba(255,255,255,0.35);text-align:center;padding:10px;">جاري الدوران...</div>';
  const extra=(6+Math.floor(Math.random()*6))*2*Math.PI,target=G.prizeAngle+extra+Math.random()*2*Math.PI;
  const dur=4000,t0=performance.now(),a0=G.prizeAngle;
  function anim(now){
    const el=now-t0,t=Math.min(el/dur,1),ease=1-Math.pow(1-t,4);G.prizeAngle=a0+(target-a0)*ease;drawPrizeWheel(G.prizeAngle);
    if(t<1){requestAnimationFrame(anim);return;}
    G.prizeSpinning=false;
    const wn=getWheelPrizes();if(!wn.length){showPrizeCelebration('😅 نفدت الجوائز!',false,false);return;}
    const n=wn.length,sa=(2*Math.PI)/n;
    const na=((G.prizeAngle%(2*Math.PI))+(2*Math.PI))%(2*Math.PI);
    const idx=Math.floor(((2*Math.PI-na)%(2*Math.PI))/sa)%n;
    const won=wn[idx];won.remaining--;G.lastWonPrize=won.name;
    updatePrizeWheelUnlocks();renderPrizePills();drawPrizeWheel(G.prizeAngle);
    const opened=G.envelopes.filter(e=>e.opened).length;G.pendingNextAction=opened>=G.envelopeCount?'end':'next';
    showPrizeCelebration(won.name,opened>=G.envelopeCount,true);
  }
  requestAnimationFrame(anim);
}

// ===== CELEBRATION =====
const PRIZE_EMOJIS=['🎁','🏆','💰','🍫','⭐','🎊','💎','🎮','🎀'];
function showPrizeCelebration(prize,isLast,canRespin){
  let emoji='🎁';try{const m=prize.match(/\p{Emoji_Presentation}/u);emoji=m?m[0]:PRIZE_EMOJIS[Math.floor(Math.random()*PRIZE_EMOJIS.length)];}catch{}
  document.getElementById('celebrateEmoji').textContent=emoji;document.getElementById('celebratePrizeName').textContent=prize;
  document.getElementById('celebrateNextBtn').textContent=isLast?'🏆 عرض النتائج':'التالي ✨';
  const rb=document.getElementById('celebrateRespinBtn');
  if(canRespin&&getWheelPrizes().length>0){rb.style.display='inline-flex';document.getElementById('celebrateRespinInfo').textContent='يمكن للمنسق إعادة الدوران';}
  else{rb.style.display='none';document.getElementById('celebrateRespinInfo').textContent='';}
  document.getElementById('prizeCelebrate').classList.add('open');confetti();confetti();
}
function closeCelebrate(doRespin){
  document.getElementById('prizeCelebrate').classList.remove('open');
  if(doRespin){setPhase('prize');G.prizeSpinning=false;drawPrizeWheel(G.prizeAngle);document.getElementById('prizeBtn').innerHTML='<button class="btn btn-gold btn-xl" onclick="spinPrizeWheel()">🔄 دوّر مجدداً!</button>';renderPrizePills();}
  else{if(G.pendingNextAction==='end')endGame();else nextTurn();}
}
function nextTurn(){const b=document.getElementById('wrongBanner');if(b)b.remove();setPhase('roulette');initRoulette();}

function endGame(){
  const sorted=Object.entries(G.scores).sort((a,b)=>b[1]-a[1]),medals=['🥇','🥈','🥉'];
  document.getElementById('finalScores').innerHTML=sorted.map(([name,sc],i)=>`<div class="score-row"><div class="score-rank">${medals[i]||i+1}</div><div class="score-name">${escHtml(name)}</div><div class="score-pts">${sc} نقطة</div></div>`).join('')||'<p style="text-align:center;color:rgba(255,255,255,0.35);padding:20px;">لم يُسجل أحد نقاط</p>';
  confetti();confetti();confetti();setTimeout(()=>goTo('screenResults'),1200);
}
function restartGame(){goTo('screenSetup');switchTab(3);}

function confetti(){
  const cols=['#F4C430','#FF6B9D','#A29BFE','#74BCFF','#55EFC4','#FD9644','#FF4757'];
  for(let i=0;i<70;i++){const el=document.createElement('div');el.className='confetti-piece';const sz=5+Math.random()*9;el.style.cssText=`left:${Math.random()*100}vw;background:${cols[Math.floor(Math.random()*cols.length)]};width:${sz}px;height:${sz}px;animation-duration:${2+Math.random()*2.5}s;animation-delay:${Math.random()*0.6}s;border-radius:${Math.random()>0.5?'50%':'3px'};`;document.body.appendChild(el);setTimeout(()=>el.remove(),4500);}
}

// ===== INIT =====
(function init(){
  const games=loadAllGames();
  if(games.length>0){
    const last=games[games.length-1];
    G.id=last.id;G.gameName=last.gameName;G.items=last.items||[];G.prizes=last.prizes||[];
    envCount=last.envelopeCount||9;
    document.getElementById('gameNameInput').value=G.gameName;document.getElementById('envCountDisplay').textContent=envCount;
    _syncNamePreview();renderItems();renderPlayers();
  }else{
    G.id='game_'+Date.now();loadDefaults();loadDefaultPrizes();renderItems();renderPlayers();
  }
  renderSavedGamesList();
  document.getElementById('screenMyGames').addEventListener('click',function(e){if(e.target.tagName!=='BUTTON')renderSavedGamesList();});
})();
