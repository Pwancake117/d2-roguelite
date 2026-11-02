/* D2 Roguelite — Bungie.net connection.
   Sign-in (OAuth, public client), item definitions (manifest, cached in IndexedDB),
   run loadout equip (gear + subclass), and activity sync. */
(function(){
const BNG = {
  apiKey: "767f0aab47df4f3d994cc00ab5745a3d",
  clientId: "56468",
  root: "https://www.bungie.net/Platform",
  auth: "https://www.bungie.net/en/OAuth/Authorize",
  token: "https://www.bungie.net/platform/app/oauth/token/"
};
const AUTH_KEY = "d2r.auth", OPT_KEY = "d2r.bungieOpts";
const BUCKET = {kinetic:1498876634, energy:2465295065, power:953998645, helmet:3448274439, gauntlets:3551918588, chest:14239492, legs:20886954, classitem:1585787867, subclass:3284755031};
const WEAPON_BUCKETS = {[BUCKET.kinetic]:"kinetic",[BUCKET.energy]:"energy",[BUCKET.power]:"power"};
const ARMOR_BUCKETS = [BUCKET.helmet,BUCKET.gauntlets,BUCKET.chest,BUCKET.legs,BUCKET.classitem];
const ARMOR_LABEL = {[BUCKET.helmet]:"Helmet",[BUCKET.gauntlets]:"Gauntlets",[BUCKET.chest]:"Chest",[BUCKET.legs]:"Legs",[BUCKET.classitem]:"Class item"};
const TIER = {2:"common",3:"uncommon",4:"rare",5:"legendary",6:"exotic"};
const SUBTYPE = {6:"autorifle",7:"shotgun",8:"machinegun",9:"handcannon",10:"rocketlauncher",11:"fusionrifle",12:"sniperrifle",13:"pulserifle",14:"scoutrifle",17:"sidearm",18:"sword",22:"linearfusionrifle",23:"grenadelauncher",24:"submachine",25:"tracerifle",31:"bow",33:"glaive"};
const CLASS_TYPE = {Titan:0, Hunter:1, Warlock:2};
const CLASS_NAME = {0:"Titan",1:"Hunter",2:"Warlock"};

const B = window.D2R_BUNGIE = {
  auth:null, account:null, profile:null, defs:null, chars:[], charId:null,
  busy:false, log:[], manifestState:"", lastSync:0,
  opts:{autoEquip:true, autoSync:true}
};
try { const a = JSON.parse(localStorage.getItem(AUTH_KEY)||"null"); if(a && a.expiresAt > Date.now()+60000) B.auth = a; } catch(e){}
try { Object.assign(B.opts, JSON.parse(localStorage.getItem(OPT_KEY)||"{}")); } catch(e){}
B.saveOpts = () => { try { localStorage.setItem(OPT_KEY, JSON.stringify(B.opts)); } catch(e){} };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
function note(msg, kind){ B.log.unshift({t:Date.now(), msg, kind:kind||""}); B.log = B.log.slice(0,30); window.renderBungieSoon && window.renderBungieSoon(); }
B.note = note;

/* ---------- OAuth ---------- */
B.connected = () => !!(B.auth && B.auth.expiresAt > Date.now());
B.login = () => {
  const st = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try { sessionStorage.setItem("d2r.oauthState", st); } catch(e){}
  location.href = BNG.auth + "?client_id=" + BNG.clientId + "&response_type=code&state=" + st;
};
B.logout = () => { B.auth=null; B.account=null; B.profile=null; try{localStorage.removeItem(AUTH_KEY);}catch(e){} window.render && window.render(); };
async function handleRedirect(){
  const p = new URLSearchParams(location.search);
  if(!p.get("code")) return;
  const code = p.get("code"), st = p.get("state");
  history.replaceState(null, "", location.pathname);
  let expected = null; try { expected = sessionStorage.getItem("d2r.oauthState"); } catch(e){}
  if(expected && st !== expected){ note("Sign-in was rejected: the response didn't match this browser. Try connecting again.","err"); return; }
  const body = new URLSearchParams({grant_type:"authorization_code", code, client_id:BNG.clientId});
  const r = await fetch(BNG.token, {method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body});
  const j = await r.json().catch(()=>({}));
  if(!r.ok || !j.access_token){ note("Bungie sign-in failed: "+(j.error_description||j.error||r.status),"err"); return; }
  B.auth = {token:j.access_token, expiresAt:Date.now()+ (j.expires_in||3600)*1000, bnetId:j.membership_id};
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(B.auth)); } catch(e){}
  note("Connected to Bungie.net","ok");
}

/* ---------- API ---------- */
async function api(path, opts={}){
  const headers = {"X-API-Key":BNG.apiKey};
  if(B.auth) headers.Authorization = "Bearer " + B.auth.token;
  if(opts.body) headers["Content-Type"] = "application/json";
  for(let attempt=0; attempt<4; attempt++){
    const r = await fetch(BNG.root + path, {method:opts.method||"GET", headers, body:opts.body?JSON.stringify(opts.body):undefined});
    if(r.status===401){ B.logout(); throw {status:"AuthExpired", message:"Your Bungie sign-in expired. Connect again."}; }
    const j = await r.json().catch(()=>null);
    if(!j) throw {status:"BadResponse", message:"Bungie.net returned an unreadable response ("+r.status+")."};
    if(j.ErrorCode === 1) return j.Response;
    if(j.ThrottleSeconds > 0 || j.ErrorStatus==="ThrottleLimitExceededMinutes" || j.ErrorStatus==="DestinyThrottledByGameServer" || j.ErrorStatus==="ThrottleLimitExceededMomentarily"){
      await sleep(Math.max(1, j.ThrottleSeconds||1)*1000 + 300); continue;
    }
    throw {status:j.ErrorStatus, code:j.ErrorCode, message:j.Message};
  }
  throw {status:"Throttled", message:"Bungie.net is rate-limiting requests. Wait a minute and try again."};
}
B.api = api;
const ORBIT_HASH = 82913930;
function needsOrbit(e){ return /AtThisLocation|CannotPerformAction|InActivity|NotInOrbit|orbit/i.test(((e&&e.status)||"")+" "+((e&&e.message)||"")); }
B.needsOrbit = needsOrbit;
function friendly(e){
  const s = e && e.status || "";
  if(needsOrbit(e)) return "Bungie only allows this in orbit (or while you're logged off). The app will finish it as soon as you're in orbit.";
  if(/AtThisLocation|CannotPerformAction|InActivity|DestinyItemActionForbidden/i.test(s)) return "Bungie won't change gear here. Go to orbit or a social space and try again.";
  if(/NoRoomInDestination/i.test(s)) return "Your character's inventory is full for that slot.";
  if(/SystemDisabled|Maintenance/i.test(s)) return "Bungie.net is down for maintenance.";
  return (e && e.message) || String(e);
}
B.friendly = friendly;

/* ---------- Account + profile ---------- */
async function loadAccount(){
  const m = await api("/User/GetMembershipsForCurrentUser/");
  const list = m.destinyMemberships || [];
  if(!list.length) throw {message:"This Bungie account has no Destiny 2 characters."};
  let pickM = list.find(x=>x.crossSaveOverride && x.crossSaveOverride===x.membershipType) || list.find(x=>String(x.membershipId)===String(m.primaryMembershipId)) || list[0];
  B.account = {type:pickM.membershipType, id:pickM.membershipId, name:(m.bungieNetUser && (m.bungieNetUser.cachedBungieGlobalDisplayName || m.bungieNetUser.displayName)) || pickM.displayName};
}
async function loadProfile(){
  const a = B.account;
  B.profile = await api(`/Destiny2/${a.type}/Profile/${a.id}/?components=100,102,200,201,205,300,305`);
  const chars = B.profile.characters && B.profile.characters.data || {};
  B.chars = Object.values(chars).map(c=>({id:c.characterId, cls:CLASS_NAME[c.classType], light:c.light, last:Date.parse(c.dateLastPlayed)||0, emblem:c.emblemPath}))
    .sort((x,y)=>y.last-x.last);
}
B.refresh = async () => { await loadProfile(); window.render && window.render(); };

/* ---------- Item definitions (manifest) ---------- */
function idb(){ return new Promise((res,rej)=>{ const r = indexedDB.open("d2r",1); r.onupgradeneeded=()=>r.result.createObjectStore("kv"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function idbGet(k){ try { const d = await idb(); return await new Promise(res=>{ const q = d.transaction("kv").objectStore("kv").get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); }); } catch(e){ return null; } }
async function idbSet(k,v){ try { const d = await idb(); await new Promise(res=>{ const t = d.transaction("kv","readwrite"); t.objectStore("kv").put(v,k); t.oncomplete=res; t.onerror=res; }); } catch(e){} }
async function loadDefs(){
  if(B.defs) return B.defs;
  const man = await api("/Destiny2/Manifest/");
  const paths = man.jsonWorldComponentContentPaths && man.jsonWorldComponentContentPaths.en || {};
  const path = paths.DestinyInventoryItemLiteDefinition || paths.DestinyInventoryItemDefinition;
  const cacheKey = "defs:" + path;
  const cached = await idbGet("defs");
  if(cached && cached.key === cacheKey){ B.defs = cached.data; return B.defs; }
  B.manifestState = "Downloading Destiny item data (first time only)…"; window.renderBungieSoon && window.renderBungieSoon();
  const raw = await (await fetch("https://www.bungie.net" + path)).json();
  // keep only what the app needs: weapons, armor and subclasses
  const slim = {};
  for(const h in raw){
    const d = raw[h], inv = d.inventory || {};
    if(d.itemType!==2 && d.itemType!==3 && d.itemType!==16) continue;
    slim[h] = {n:d.displayProperties && d.displayProperties.name, t:d.itemType, st:d.itemSubType, c:d.classType, tier:inv.tierType, b:inv.bucketTypeHash};
  }
  B.defs = slim; B.manifestState = "";
  await idbSet("defs", {key:cacheKey, data:slim});
  return slim;
}

/* ---------- Inventory model ---------- */
function allItems(){
  const P = B.profile, out = [];
  const inst = (P.itemComponents && P.itemComponents.instances && P.itemComponents.instances.data) || {};
  const push = (it, owner, equipped) => {
    if(!it.itemInstanceId) return;
    const d = B.defs[it.itemHash]; if(!d) return;
    out.push({inst:it.itemInstanceId, hash:it.itemHash, d, owner, equipped, postmaster: it.bucketHash===215593132, canEquip: inst[it.itemInstanceId] ? inst[it.itemInstanceId].canEquip !== false : true, bucket:d.b});
  };
  ((P.profileInventory && P.profileInventory.data && P.profileInventory.data.items) || []).forEach(it=>push(it,"vault",false));
  const ci = (P.characterInventories && P.characterInventories.data) || {}, ce = (P.characterEquipment && P.characterEquipment.data) || {};
  Object.keys(ci).forEach(cid=>ci[cid].items.forEach(it=>push(it,cid,false)));
  Object.keys(ce).forEach(cid=>ce[cid].items.forEach(it=>push(it,cid,true)));
  return out;
}
/* Does a Destiny item satisfy one of the run's gear rules? */
function weaponAllowed(run, it){
  const d = it.d, slot = WEAPON_BUCKETS[d.b], rarity = TIER[d.tier], type = SUBTYPE[d.st];
  if(d.t!==3 || !slot) return false;
  return run.weapons.some(w=>{
    if(w.inst) return w.inst===it.inst; // looted this run
    const wslot = w.slot || (w.ammo==="heavy" ? "power" : "kinetic");
    if(w.rarity==="exotic") return rarity==="exotic" && d.n===w.name;
    if(w.any) return rarity===w.rarity && slot===wslot;
    return rarity===w.rarity && type===w.dim && slot===wslot;
  });
}
function armorAllowed(run, it){
  const d = it.d; if(d.t!==2 || !ARMOR_BUCKETS.includes(d.b)) return false;
  if(d.c!==CLASS_TYPE[run.cls] && d.c!==3) return false;
  if(TIER[d.tier]==="common") return true;
  return run.armor.some(a=>a.inst ? a.inst===it.inst : (TIER[d.tier]==="exotic" && a.name===d.n));
}
B.allowedCounts = run => {
  if(!B.profile || !B.defs) return null;
  const items = allItems();
  const res = {};
  Object.entries(WEAPON_BUCKETS).forEach(([b,slot])=>res[slot] = items.filter(i=>i.d.b==b && weaponAllowed(run,i)).length);
  ARMOR_BUCKETS.forEach(b=>res[ARMOR_LABEL[b]] = items.filter(i=>i.d.b==b && armorAllowed(run,i)).length);
  return res;
};

/* ---------- Moving and equipping ---------- */
async function transfer(it, toVault, characterId){
  await api("/Destiny2/Actions/Items/TransferItem/", {method:"POST", body:{itemReferenceHash:it.hash, stackSize:1, transferToVault:toVault, itemId:it.inst, characterId, membershipType:B.account.type}});
}
async function makeRoom(cid, bucket, keep){
  const items = allItems().filter(i=>i.owner===cid && !i.equipped && i.d.b===bucket && !keep.has(i.inst));
  if(!items.length) return false;
  await transfer(items[0], true, cid); return true;
}
/* An allowed item is equipped on another character: equip a stand-in there so it can move. */
async function freeUp(it){
  const owner = it.owner, ownerChar = B.chars.find(c=>c.id===owner);
  const ownerClass = ownerChar ? CLASS_TYPE[ownerChar.cls] : -1;
  const fits = i => i.d.b===it.d.b && i.inst!==it.inst && (i.d.c===3 || i.d.c===ownerClass) && TIER[i.d.tier]!=="exotic";
  const items = allItems();
  let rep = items.find(i=>i.owner===owner && !i.equipped && fits(i));
  if(!rep){
    rep = items.find(i=>i.owner==="vault" && fits(i));
    if(!rep) throw {message:"Couldn't free "+it.d.n+" from your "+(ownerChar?ownerChar.cls:"other character")+": nothing else to equip in that slot."};
    await transfer(rep, false, owner); rep.owner = owner;
  }
  await api("/Destiny2/Actions/Items/EquipItem/", {method:"POST", body:{itemId:rep.inst, characterId:owner, membershipType:B.account.type}});
  it.equipped = false;
  note("Borrowed "+it.d.n+" from your "+(ownerChar?ownerChar.cls:"other character")+" (equipped "+rep.d.n+" there instead).");
}
async function moveTo(it, cid, keep){
  if(it.postmaster){
    await api("/Destiny2/Actions/Items/PullFromPostmaster/", {method:"POST", body:{itemReferenceHash:it.hash, stackSize:1, itemId:it.inst, characterId:it.owner, membershipType:B.account.type}});
    it.postmaster = false;
  }
  if(it.owner===cid) return;
  if(it.equipped) await freeUp(it);
  if(it.owner!=="vault"){ await transfer(it, true, it.owner); it.owner="vault"; }
  try { await transfer(it, false, cid); }
  catch(e){
    if(/NoRoom/i.test(e.status||"") && await makeRoom(cid, it.d.b, keep)) await transfer(it, false, cid);
    else throw e;
  }
  it.owner = cid;
}
function choose(cands, cid){
  // best rarity first (looted gear beats starter commons), then items already on the character,
  // then free copies, then borrowing from another character; random among equals
  const rank = i => (i.owner===cid ? 0 : i.equipped ? 2 : 1);
  const shuffled = cands.slice().sort(()=>Math.random()-0.5);
  return shuffled.sort((a,b)=>(b.d.tier-a.d.tier) || (rank(a)-rank(b)))[0];
}

/* Equip the run's current loadout on the chosen character: gear + subclass. */
B.applyRun = async (run, {quiet, gearOnly} = {}) => {
  if(B.busy) return; if(!B.connected()){ note("Connect your Bungie account first.","err"); return; }
  B.busy = true; window.renderBungieSoon && window.renderBungieSoon();
  const cid = B.charId;
  try {
    await loadDefs(); await loadProfile();
    if(!cid) throw {message:"No "+run.cls+" character found on this account."};
    const items = allItems(), keep = new Set(), equipIds = [], missing = [];
    let exoticWeaponUsed = false, exoticArmorUsed = false;
    // weapons
    for(const [b, slot] of Object.entries(WEAPON_BUCKETS)){
      const cur = items.find(i=>i.owner===cid && i.equipped && i.d.b==b);
      if(cur && weaponAllowed(run, cur)){ keep.add(cur.inst); if(TIER[cur.d.tier]==="exotic") exoticWeaponUsed = true; continue; }
      let cands = items.filter(i=>i.d.b==b && weaponAllowed(run,i) && (i.owner!==cid || !i.equipped) && (i.canEquip || i.owner!==cid));
      if(exoticWeaponUsed) cands = cands.filter(i=>TIER[i.d.tier]!=="exotic");
      const nonEx = cands.filter(i=>TIER[i.d.tier]!=="exotic");
      const pickIt = choose(nonEx.length ? nonEx : cands, cid);
      if(!pickIt){ missing.push(slot==="power" ? "an uncommon (green) power weapon" : "a common (white) "+slot+" weapon"); continue; }
      if(TIER[pickIt.d.tier]==="exotic") exoticWeaponUsed = true;
      await moveTo(pickIt, cid, keep); keep.add(pickIt.inst); equipIds.push(pickIt.inst);
    }
    // armor
    for(const b of ARMOR_BUCKETS){
      const cur = items.find(i=>i.owner===cid && i.equipped && i.d.b===b);
      if(cur && armorAllowed(run, cur)){ keep.add(cur.inst); if(TIER[cur.d.tier]==="exotic") exoticArmorUsed = true; continue; }
      let cands = items.filter(i=>i.d.b===b && armorAllowed(run,i) && (i.owner!==cid || !i.equipped) && (i.canEquip || i.owner!==cid));
      if(exoticArmorUsed) cands = cands.filter(i=>TIER[i.d.tier]!=="exotic");
      const pickIt = choose(cands, cid);
      if(!pickIt){ missing.push("common "+ARMOR_LABEL[b].toLowerCase()+" for your "+run.cls); continue; }
      if(TIER[pickIt.d.tier]==="exotic") exoticArmorUsed = true;
      await moveTo(pickIt, cid, keep); keep.add(pickIt.inst); equipIds.push(pickIt.inst);
    }
    if(equipIds.length){
      const r = await api("/Destiny2/Actions/Items/EquipItems/", {method:"POST", body:{itemIds:equipIds, characterId:cid, membershipType:B.account.type}});
      const failed = (r.equipResults||[]).filter(x=>x.equipStatus!==1).length;
      if(failed) note(failed+" item(s) couldn't be equipped. Go to orbit or a social space and press Equip again.","err");
    }
    let subclassDone = true;
    if(!gearOnly){
      try { await applySubclass(run, cid); B.pendingOrbit = false; }
      catch(e){ if(needsOrbit(e)){ subclassDone = false; B.pendingOrbit = true; } else throw e; }
    }
    await sleep(4000); await loadProfile();
    if(!subclassDone) note("Gear is set. Your subclass changes need orbit: the app will apply them as soon as you're in orbit.","err");
    if(missing.length) note("Missing from your inventory: "+missing.join(", ")+". Pull them from Collections in game, then press Equip again.","err");
    else if(!subclassDone){ /* already explained above */ }
    else if(!quiet) note((gearOnly ? "Common gear equipped on your " : "Run loadout equipped on your ")+run.cls+".","ok");
    else note("Loadout updated in game.","ok");
  } catch(e){ note(friendly(e),"err"); }
  finally { B.busy = false; window.render && window.render(); }
};

const defCache = {};
async function fullDef(hash){
  if(defCache[hash]) return defCache[hash];
  defCache[hash] = await api(`/Destiny2/Manifest/DestinyInventoryItemDefinition/${hash}/`);
  return defCache[hash];
}
async function insertPlug(itemId, cid, socketIndex, plugItemHash){
  await api("/Destiny2/Actions/Items/InsertSocketPlugFree/", {method:"POST", body:{plug:{socketIndex, socketArrayType:0, plugItemHash}, itemId, characterId:cid, membershipType:B.account.type}});
  await sleep(350);
}
async function applySubclass(run, cid){
  const lo = window.dimLoadout(run), target = lo.equipped[0], hash = target.hash;
  let sub = allItems().find(i=>i.owner===cid && i.hash===hash);
  if(!sub) throw {message:"Your "+run.cls+" doesn't have the "+window.ELEMENTS[run.el].name+" subclass unlocked."};
  if(!sub.equipped){ await api("/Destiny2/Actions/Items/EquipItem/", {method:"POST", body:{itemId:sub.inst, characterId:cid, membershipType:B.account.type}}); await sleep(1500); await loadProfile(); }
  const def = await fullDef(hash);
  const entries = (def.sockets && def.sockets.socketEntries) || [];
  const cur = ((B.profile.itemComponents.sockets.data[sub.inst]||{}).sockets||[]).map(s=>s.plugHash);
  const prism = run.el==="prismatic";
  const aspectIdx = prism ? [7,8] : [5,6], fragIdx = prism ? [9,10,11,12,13,14] : [7,8,9,10,11,12];
  const want = {}; Object.entries(target.socketOverrides).forEach(([k,v])=>want[+k]=v);
  const empty = i => entries[i] && entries[i].singleInitialItemHash;
  // 1) clear aspect/fragment sockets that hold something we don't want there
  for(const i of fragIdx.concat(aspectIdx)){
    if(cur[i] && cur[i]!==want[i] && cur[i]!==empty(i) && empty(i)){ try { await insertPlug(sub.inst, cid, i, empty(i)); cur[i]=empty(i); } catch(e){} }
  }
  // 2) abilities, aspects, then fragments
  const order = [0,2,3,4].concat(aspectIdx, fragIdx);
  for(const i of order){
    if(want[i] && cur[i]!==want[i]){
      try { await insertPlug(sub.inst, cid, i, want[i]); cur[i]=want[i]; }
      catch(e){ if(needsOrbit(e)) throw e; note("Couldn't set one subclass slot: "+friendly(e),"err"); }
    }
  }
}

/* ---------- Activity sync ---------- */
/* Only Vanguard Ops activities count as events. Bungie tags them with these activity types,
   and Quickplay nodes also report the Ops category as their destination. */
const DUNGEON_TYPE = 608898761, DUNGEON_MODE = 82;
const VO_TYPES = {1996806804:"fireteam", 2009300208:"arena", 3851289711:"solo", 3652020199:"pinnacle"};
const VO_DESTS = {2171594315:"fireteam", 103806431:"arena", 4008773657:"solo"};
function classify(info){
  if(!info) return null;
  return VO_TYPES[info.type] || VO_DESTS[info.dest] || null;
}
function difficulty(name){
  if(/ultimate|grandmaster/i.test(name)) return 4;
  if(/master/i.test(name)) return 3;
  if(/expert|legend/i.test(name)) return 2;
  if(/advanced|hero/i.test(name)) return 1;
  return 0;
}
const actInfo = {};
async function activityInfo(hash){
  if(actInfo[hash]) return actInfo[hash];
  try { const d = await api(`/Destiny2/Manifest/DestinyActivityDefinition/${hash}/`); actInfo[hash] = {name:(d.displayProperties && d.displayProperties.name) || "Activity", type:d.activityTypeHash, dest:d.destinationHash}; }
  catch(e){ actInfo[hash] = null; }
  return actInfo[hash];
}
/* Pull activities finished since the run started and queue them as events. */
B.sync = async (run, {quiet} = {}) => {
  if(!B.connected() || !run || run.status!=="active" || B.busy) return 0;
  const cid = B.charId; if(!cid) return 0;
  B.busy = true; window.renderBungieSoon && window.renderBungieSoon();
  let added = 0;
  try {
    const a = B.account;
    const r = await api(`/Destiny2/${a.type}/Account/${a.id}/Character/${cid}/Stats/Activities/?count=25&mode=0&page=0`);
    const acts = (r.activities||[]).filter(x=>Date.parse(x.period) >= run.startedAt).reverse();
    run.synced = run.synced || [];
    run.queue = run.queue || [];
    for(const act of acts){
      const id = act.activityDetails.instanceId;
      if(run.synced.includes(id)) continue;
      run.synced.push(id);
      const v = act.values || {}, val = k => v[k] && v[k].basic ? v[k].basic.value : 0;
      const info = await activityInfo(act.activityDetails.directorActivityHash || act.activityDetails.referenceId);
      const isDungeon = info && (info.type===DUNGEON_TYPE || (act.activityDetails.modes||[]).includes(DUNGEON_MODE) || act.activityDetails.mode===DUNGEON_MODE);
      const type = run.mode==="dungeon" ? (isDungeon ? "dungeon" : null) : classify(info);
      if(!type) continue; // not an activity this run type counts
      const name = info.name;
      const completed = val("completed")===1 && val("completionReason")!==1 && val("completionReason")!==2;
      const deaths = val("deaths");
      if(!completed && !deaths) continue; // left early without dying: not an event
      run.queue.push({eventId:type, diff:difficulty(name), completed, deaths, note:name, at:Date.parse(act.period), instanceId:id});
      added++;
    }
    // what's equipped right now (hardcore losses), and anything new picked up since the last sync
    if(added || (run.ownedAtStart && Date.now() - (B.lastLootCheck||0) > 300000)){
      B.lastLootCheck = Date.now();
      await loadDefs(); await loadProfile();
      const eqLoot = B.equippedLoot(run);
      if(added) run.queue.slice(-added).forEach(q=>{ if(q.deaths) q.equippedLoot = eqLoot; });
      const loot = findLoot(run);
      if(loot.length){
        loot.forEach(x=>{ x.source = added ? run.queue[run.queue.length-1].note : "Found during the run"; (x.kind==="weapon" ? run.weapons : run.armor).push(x); });
        if(added) run.queue[run.queue.length-1].loot = loot.map(x=>x.name);
        else run.unattachedLoot = (run.unattachedLoot||[]).concat(loot.map(x=>x.name));
        note("Looted: "+loot.map(x=>x.name).join(", ")+". You can use "+(loot.length>1?"them":"it")+" now.","ok");
      }
    }
    B.lastSync = Date.now();
    if(added) note(added+" new activit"+(added>1?"ies":"y")+" synced from Bungie.","ok");
    else if(!quiet) note("No new activities since your last sync.");
  } catch(e){ note(friendly(e),"err"); }
  finally { B.busy = false; }
  return added;
};

/* Real loot: every weapon/armor instance owned at run start is "old"; anything new is looted. */
const ARMOR_NAME = {[BUCKET.helmet]:"helmet",[BUCKET.gauntlets]:"gauntlets",[BUCKET.chest]:"chest",[BUCKET.legs]:"legs",[BUCKET.classitem]:"classitem"};
B.snapshot = async run => {
  await loadDefs(); await loadProfile();
  run.ownedAtStart = allItems().filter(i=>i.d.t===2||i.d.t===3).map(i=>i.inst);
};
function findLoot(run){
  if(!run.ownedAtStart) return [];
  const old = new Set(run.ownedAtStart), have = new Set(run.weapons.concat(run.armor).map(x=>x.inst).filter(Boolean).concat(run.lostLoot||[]));
  const found = [];
  for(const it of allItems()){
    const d = it.d;
    if(old.has(it.inst) || have.has(it.inst)) continue;
    if(d.t===3 && WEAPON_BUCKETS[d.b]){
      found.push({kind:"weapon", inst:it.inst, hash:it.hash, name:d.n, rarity:TIER[d.tier]||"common", slot:WEAPON_BUCKETS[d.b], dim:SUBTYPE[d.st]||"", ammo:WEAPON_BUCKETS[d.b]==="power"?"heavy":"special"});
    } else if(d.t===2 && ARMOR_BUCKETS.includes(d.b) && (d.c===CLASS_TYPE[run.cls] || d.c===3)){
      found.push({kind:"armor", inst:it.inst, hash:it.hash, name:d.n, rarity:TIER[d.tier]||"common", piece:ARMOR_NAME[d.b]});
    }
    have.add(it.inst);
  }
  return found;
}
B.findLoot = findLoot;
B.equippedLoot = run => {
  if(!B.profile || !B.charId) return [];
  const eq = ((B.profile.characterEquipment.data[B.charId]||{}).items||[]).map(i=>i.itemInstanceId);
  return run.weapons.concat(run.armor).filter(x=>x.inst && eq.includes(x.inst)).map(x=>x.inst);
};

/* Which activity is the run's character in right now? Used to detect dungeons live. */
B.current = null;
B.pollCurrent = async run => {
  if(!B.connected() || !B.charId) return;
  try {
    const a = B.account;
    const p = await api(`/Destiny2/${a.type}/Profile/${a.id}/Character/${B.charId}/?components=204`);
    const ca = p.activities && p.activities.data;
    const hash = ca && ca.currentActivityHash;
    const info = hash ? await activityInfo(hash) : null;
    const counted = info && (run.mode==="dungeon" ? info.type===DUNGEON_TYPE : !!classify(info));
    const key = hash ? hash+"@"+ca.dateActivityStarted : "";
    // left a counted activity since the last check: its result is about to post
    if(B.lastAct && B.lastAct.counted && B.lastAct.key !== key) B.justLeft = Date.now();
    B.lastAct = {key, counted};
    B.inOrbit = !hash || hash===ORBIT_HASH;
    if(info && info.type===DUNGEON_TYPE){
      B.current = {hash, name:info.name.replace(/:\s*(Standard|Normal|Master|Legend|Expert|Advanced)\s*$/i,""), diff:difficulty(info.name), started:ca.dateActivityStarted};
    } else B.current = null;
  } catch(e){ /* keep the last known state */ }
};

/* ---------- Startup ---------- */
B.init = async () => {
  try { await handleRedirect(); } catch(e){ note("Bungie sign-in failed: "+friendly(e),"err"); }
  if(!B.connected()) { window.render && window.render(); return; }
  try {
    await loadAccount(); await loadProfile();
    loadDefs().then(()=>window.render && window.render()).catch(e=>note("Couldn't load item data: "+friendly(e),"err"));
  } catch(e){ note(friendly(e),"err"); }
  window.render && window.render();
};
B.pickChar = run => {
  if(!run) return null;
  const mine = B.chars.filter(c=>c.cls===run.cls);
  if(!mine.length) return null;
  if(!B.charId || !mine.some(c=>c.id===B.charId)) B.charId = mine[0].id;
  return B.charId;
};
})();
