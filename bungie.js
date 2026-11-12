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
  opts:{autoSubclass:true, autoSync:true}
};
try { const a = JSON.parse(localStorage.getItem(AUTH_KEY)||"null"); if(a && a.expiresAt > Date.now()+60000) B.auth = a; } catch(e){}
try { const o = JSON.parse(localStorage.getItem(OPT_KEY)||"{}"); delete o.autoEquip; Object.assign(B.opts, o); } catch(e){}
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
/* remembers that this browser was signed in, so an expired sign-in can show a Reconnect prompt
   (cleared only when the player disconnects on purpose) */
const WAS_KEY = "d2r.wasConnected";
B.expired = () => { if(B.connected()) return false; try { return localStorage.getItem(WAS_KEY)==="1"; } catch(e){ return false; } };
B.disconnect = () => { try { localStorage.removeItem(WAS_KEY); } catch(e){} B.logout(); };
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
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(B.auth)); localStorage.setItem(WAS_KEY, "1"); } catch(e){}
  note("Connected to Bungie.net","ok");
}

/* ---------- API ---------- */
async function api(path, opts={}){
  const headers = {"X-API-Key":BNG.apiKey};
  if(B.auth) headers.Authorization = "Bearer " + B.auth.token;
  if(opts.body) headers["Content-Type"] = "application/json";
  for(let attempt=0; attempt<4; attempt++){
    // Bungie's edge serves stale copies of repeated GET URLs: make every read unique
    const url = BNG.root + path + ((opts.method||"GET")==="GET" ? (path.includes("?")?"&":"?") + "_=" + Date.now().toString(36) + attempt : "");
    const r = await fetch(url, {method:opts.method||"GET", headers, cache:"no-store", body:opts.body?JSON.stringify(opts.body):undefined});
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
  const cacheKey = "defs4:" + path;
  const cached = await idbGet("defs");
  if(cached && cached.key === cacheKey){ B.defs = cached.data; return B.defs; }
  B.manifestState = "Downloading Destiny item data (first time only)…"; window.renderBungieSoon && window.renderBungieSoon();
  const raw = await (await fetch("https://www.bungie.net" + path)).json();
  // keep only what the app needs: weapons, armor, subclasses and engrams
  const slim = {};
  for(const h in raw){
    const d = raw[h], inv = d.inventory || {};
    // engrams come in several item types (8, 19, 0); their type name says "Engram" (e.g. "Tier 2 Engram")
    const isEngram = d.itemType===8 || /engram/i.test(d.itemTypeDisplayName||"") || (d.itemType===19 && /engram/i.test((d.displayProperties||{}).name||""));
    if(d.itemType!==2 && d.itemType!==3 && d.itemType!==16 && !isEngram) continue;
    if(isEngram){ slim[h] = {n:d.displayProperties && d.displayProperties.name, i:d.displayProperties && d.displayProperties.icon, t:8, tier:inv.tierType, b:inv.bucketTypeHash, tn:d.itemTypeDisplayName}; continue; }
    slim[h] = {n:d.displayProperties && d.displayProperties.name, i:d.displayProperties && d.displayProperties.icon, t:d.itemType, st:d.itemSubType, c:d.classType, tier:inv.tierType, b:inv.bucketTypeHash};
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
B.applyRun = async (run, {quiet, gearOnly, subclassOnly} = {}) => {
  if(B.busy) return; if(!B.connected()){ note("Connect your Bungie account first.","err"); return; }
  B.busy = true; window.renderBungieSoon && window.renderBungieSoon();
  const cid = B.charId;
  try {
    await loadDefs(); await loadProfile();
    if(!cid) throw {message:"No "+run.cls+" character found on this account."};
    const items = allItems(), keep = new Set(), equipIds = [], missing = [];
    let exoticWeaponUsed = false, exoticArmorUsed = false;
    if(!subclassOnly){
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
    } // end gear
    let subclassDone = true;
    if(!gearOnly){
      try { await applySubclass(run, cid); B.pendingOrbit = false; }
      catch(e){ if(needsOrbit(e)){ subclassDone = false; B.pendingOrbit = true; } else throw e; }
    }
    await sleep(4000); await loadProfile();
    if(!subclassDone) note("Gear is set. Your subclass changes need orbit: the app will apply them as soon as you're in orbit.","err");
    if(missing.length) note("Missing from your inventory: "+missing.join(", ")+". Pull them from Collections in game, then press Equip again.","err");
    else if(!subclassDone){ /* already explained above */ }
    else if(!quiet) note((gearOnly ? "Starting loadout (common gear) equipped on your " : "Run loadout equipped on your ")+run.cls+".","ok");
    else note(subclassOnly ? "Subclass updated in game." : "Loadout updated in game.","ok");
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
  const order = [0,1,2,3,4].concat(aspectIdx, fragIdx);   // 0 class ability, 1 jump, 2 super, 3 melee, 4 grenade
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
const LEAVE_GRACE_SECONDS = 300; // leave within 5 minutes: doesn't count
const VO_TYPES = {1996806804:"fireteam", 2009300208:"arena", 3851289711:"solo", 3652020199:"pinnacle"};
const VO_DESTS = {2171594315:"fireteam", 103806431:"arena", 4008773657:"solo"};
/* Activities launched from the Vanguard Ops tabs that Bungie tags by their own type rather than an Ops type:
   strikes/Nightfalls/Onslaught (Fireteam Ops), 6-player seasonal arenas (Arena Ops), exotic missions (Pinnacle Ops). */
const FIRETEAM_MODES = [3, 18, 16, 17, 46];
const ONSLAUGHT_TYPE = 2897687202, EXOTIC_MISSION_TYPE = 1227821118;
const STORY_TYPE = 1686739444, STORY_MODE = 2;   // campaign missions
const ARENA_TYPES = [102866517, 263019149, 904017341, 1728319841, 3481239102, 3565127261];
function classify(info, act){
  if(!info) return null;
  const direct = VO_TYPES[info.type] || VO_DESTS[info.dest];
  if(direct) return direct;
  const d = act && act.activityDetails, modes = d ? (d.modes||[]).concat([d.mode]) : [];
  if(modes.some(m=>[5,63,75].includes(m))) return null; // never PvP / Gambit
  if(info.type===EXOTIC_MISSION_TYPE) return "pinnacle";
  if(ARENA_TYPES.includes(info.type)) return "arena";
  if(info.type===ONSLAUGHT_TYPE || modes.some(m=>FIRETEAM_MODES.includes(m))) return "fireteam";
  if(info.type===STORY_TYPE || modes.includes(STORY_MODE)) return /legend/i.test(info.name||"") ? "missionL" : "mission";
  return null;
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
  try { const d = await api(`/Destiny2/Manifest/DestinyActivityDefinition/${hash}/`); actInfo[hash] = {name:(d.displayProperties && d.displayProperties.name) || "Activity", type:d.activityTypeHash, dest:d.destinationHash, modes:d.activityModeHashes||[], desc:(d.displayProperties && d.displayProperties.description) || ""}; }
  catch(e){ actInfo[hash] = null; }
  return actInfo[hash];
}
/* Event details: the actual activity played (a playlist like Quickplay points at the real strike/mission),
   its activity type (e.g. Strike, Reclaim), its destination, time played, kills and deaths. */
const typeNames = {}, destNames = {}, modeNames = {};
async function defName(kind, hash, cache){
  if(!hash) return "";
  if(cache[hash]!==undefined) return cache[hash];
  try { const d = await api(`/Destiny2/Manifest/${kind}/${hash}/`); cache[hash] = (d.displayProperties && d.displayProperties.name) || ""; } catch(e){ cache[hash] = ""; }
  return cache[hash];
}
async function activityDetails(act){
  const ad = act.activityDetails, v = act.values || {}, val = k => v[k] && v[k].basic ? v[k].basic.value : 0;
  const playlist = await activityInfo(ad.directorActivityHash || ad.referenceId);
  const real = ad.referenceId && ad.referenceId!==ad.directorActivityHash ? await activityInfo(ad.referenceId) : playlist;
  // the mode name ("Strike", "Lost Sector"…) describes the activity better than its type ("Mission")
  const modeName = real && real.modes && real.modes.length ? await defName("DestinyActivityModeDefinition", real.modes[0], modeNames) : "";
  const typeName = modeName || await defName("DestinyActivityTypeDefinition", (real&&real.type) || (playlist&&playlist.type), typeNames);
  const place = await defName("DestinyDestinationDefinition", (real&&real.dest) || (playlist&&playlist.dest), destNames);
  const strip = n => (n||"").replace(/:\s*(Matchmade|Customize|Standard|Normal)\s*$/i,"");
  return {
    activity: strip(real && real.name), playlist: playlist && real && playlist.name!==real.name ? playlist.name : "",
    type: typeName, place, minutes: Math.round((val("timePlayedSeconds")||val("activityDurationSeconds"))/60),
    kills: val("kills"), deaths: val("deaths"), assists: val("assists"), players: val("playerCount")||null,
    desc: ((real && real.desc) || "").split(/(?<=[.!?])\s/)[0].slice(0,140)
  };
}
B.activityDetails = activityDetails;
/* Pull activities finished since the run started and queue them as events. */
B.sync = async (run, {quiet} = {}) => {
  if(!B.connected() || !run || run.status!=="active" || B.busy) return 0;
  const cid = B.charId; if(!cid) return 0;
  B.busy = true; window.renderBungieSoon && window.renderBungieSoon();
  let added = 0;
  try {
    const a = B.account;
    const r = await api(`/Destiny2/${a.type}/Account/${a.id}/Character/${cid}/Stats/Activities/?count=25&mode=0&page=0`);
    // skip activities played while this run was saved away (paused)
    const paused = t => (run.pauses||[]).some(p=>t>=p.from && t<(p.to||Infinity));
    const acts = (r.activities||[]).filter(x=>{ const t = Date.parse(x.period); return t >= run.startedAt && !paused(t); }).reverse();
    run.synced = run.synced || [];
    run.queue = run.queue || [];
    for(const act of acts){
      const id = act.activityDetails.instanceId;
      if(run.synced.includes(id)) continue;
      run.synced.push(id);
      // never log the same Bungie activity twice, even if two syncs overlap
      if(run.events.some(e=>e.instanceId===id) || run.queue.some(q=>q.instanceId===id)) continue;
      const v = act.values || {}, val = k => v[k] && v[k].basic ? v[k].basic.value : 0;
      const info = await activityInfo(act.activityDetails.directorActivityHash || act.activityDetails.referenceId);
      const isDungeon = info && (info.type===DUNGEON_TYPE || (act.activityDetails.modes||[]).includes(DUNGEON_MODE) || act.activityDetails.mode===DUNGEON_MODE);
      // dungeons count in both run types: Vanguard Ops runs log a full dungeon clear as one event
      const type = isDungeon ? "dungeon" : run.mode==="dungeon" ? null : classify(info, act);
      if(!type) continue; // not an activity this run type counts
      const name = info.name;
      const completed = val("completed")===1 && val("completionReason")!==1 && val("completionReason")!==2;
      const deaths = val("deaths");
      // leaving: within the grace period it's not an event; after it, it counts as a failed attempt
      const played = val("timePlayedSeconds") || val("activityDurationSeconds");
      if(!completed && played < LEAVE_GRACE_SECONDS) continue;
      const start = Date.parse(act.period), isMission = type==="mission" || type==="missionL";
      // some missions are reported as two back-to-back activities (e.g. The Arrival): the second part is the same mission, not a new one
      const base = n => (n||"").replace(/:\s*(Legendary|Normal|Classic|Matchmade|Customize)\s*$/i,"").trim();
      if(isMission && run.lastMission && run.lastMission.name===base(name) && start - run.lastMission.end < 10*60e3){
        run.lastMission.end = start + played*1000;
        const q = run.queue.find(x=>x.instanceId===run.lastMission.id);
        if(q){ q.deaths += deaths; q.completed = q.completed && completed; if(q.details) q.details.minutes = Math.round((q.details.minutes||0) + played/60); }
        continue;
      }
      if(isMission) run.lastMission = {name:base(name), end:start + played*1000, id};
      let details = null; try { details = await activityDetails(act); } catch(e){}
      // Legendary is the mission's tier, not a difficulty step on top of it
      const diff = isMission ? difficulty(name.replace(/legend\w*/i,"")) : difficulty(name);
      run.queue.push({eventId:type, diff, completed, deaths, note:name, at:start, instanceId:id, details});
      added++;
    }
    // what's equipped right now (hardcore losses), and anything new picked up since the last sync
    if(added || (run.ownedAtStart && Date.now() - (B.lastLootCheck||0) > 300000)){
      B.lastLootCheck = Date.now();
      await loadDefs(); await loadProfile();
      const eqLoot = B.equippedLoot(run);
      if(added) run.queue.slice(-added).forEach(q=>{ if(q.deaths || !q.completed) q.equippedLoot = eqLoot; });
      await B.loadArtifact();
      const opened = trackEngrams(run, added ? run.queue[run.queue.length-1].note : null);
      pruneGone(run);
      const loot = findLoot(run);
      if(loot.length){
        // decrypted gear only gets credited to an engram whose rarity fits (Exotic Engram -> exotic gear, other engrams -> legendary or lower)
        const fits = (e,x) => e.rarity==="exotic" ? x.rarity==="exotic" : x.rarity!=="exotic";
        // gear from engrams owned before the run doesn't count: drop matching-rarity gear, one item per pre-run engram opened
        const pre = (opened.preRun||[]).slice(), keep = [];
        for(const x of loot){ const k = pre.findIndex(r=>r==="exotic" ? x.rarity==="exotic" : x.rarity!=="exotic"); if(k>=0 && !opened.some(e=>fits(e,x))){ pre.splice(k,1); (run.ownedAtStart = run.ownedAtStart||[]).push(x.inst); note(x.name+" came from an engram you had before the run, so it isn't run loot.",""); } else keep.push(x); }
        loot.length = 0; keep.forEach(x=>loot.push(x));
        loot.forEach(x=>{ const from = opened.filter(e=>fits(e,x));
          x.source = from.length ? "Decrypted "+from.map(e=>e.name).join(", ")+(from[0].event?" ("+from[0].event+")":"") : added ? run.queue[run.queue.length-1].note : "Found during the run";
          (x.kind==="weapon" ? run.weapons : run.armor).push(x); });
        if(added) run.queue[run.queue.length-1].loot = loot.map(x=>x.name);
        else run.unattachedLoot = (run.unattachedLoot||[]).concat(loot.map(x=>x.name));
        if(loot.length) note("Looted: "+loot.map(x=>x.name).join(", ")+". You can use "+(loot.length>1?"them":"it")+" now.","ok");
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
/* Resuming a saved run: anything picked up while it was paused isn't run loot, so add it to the "owned at start" lists. */
B.rebaseline = async run => {
  if(!B.connected()) return;
  await loadDefs(); await loadProfile();
  const mine = new Set(run.weapons.concat(run.armor).map(x=>x.inst).filter(Boolean));
  const items = allItems();
  run.ownedAtStart = [...new Set((run.ownedAtStart||[]).concat(items.filter(i=>(i.d.t===2||i.d.t===3) && !mine.has(i.inst)).map(i=>i.inst)))];
  const held = new Set((run.engrams||[]).map(e=>e.inst));
  run.engramBaseline = [...new Set((run.engramBaseline||[]).concat(items.filter(i=>i.d.t===8 && !held.has(i.inst)).map(i=>i.inst)))];
};
B.snapshot = async run => {
  await loadDefs(); await loadProfile();
  run.ownedAtStart = allItems().filter(i=>i.d.t===2||i.d.t===3).map(i=>i.inst);
  run.engramBaseline = allItems().filter(i=>i.d.t===8).map(i=>i.inst);
  run.engrams = [];
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
/* Engrams: ones that drop during the run (often straight to the Postmaster if not picked up in time) are tracked
   with the event they came from; when one disappears, gear that appears in the same sync is credited to it. */
function trackEngrams(run, eventNote){
  if(!B.profile || !B.defs) return [];
  const now = allItems().filter(i=>i.d.t===8);
  if(!run.engrams){ run.engrams = []; if(!run.engramBaseline) run.engramBaseline = now.map(i=>i.inst); }
  const base = new Set(run.engramBaseline||[]), known = new Set(run.engrams.map(e=>e.inst)), present = new Set(now.map(i=>i.inst));
  // an engram pulled from the Postmaster can come back under a new id: a tracked engram that vanished plus a new
  // engram of the same kind in the same check is the same engram moving, not a decrypt
  for(const e of run.engrams.filter(e=>e.status==="held" && !e.stack && !present.has(e.inst))){
    const moved = now.find(it=>it.hash===e.hash && !base.has(it.inst) && !known.has(it.inst));
    if(moved){ e.inst = moved.inst; known.add(moved.inst); }
  }
  for(const it of now) if(!base.has(it.inst) && !known.has(it.inst)){
    // seen mid-activity (before the activity lands in history): hold the tag until that activity is synced
    const pendingTag = !eventNote && ((B.lastAct && B.lastAct.counted) || (B.justLeft && Date.now()-B.justLeft < 15*60000));
    run.engrams.push({inst:it.inst, hash:it.hash, name:it.d.n||"Engram", rarity:TIER[it.d.tier]||"rare", event:eventNote||(pendingTag?"Current activity":(run.events.length?run.events[run.events.length-1].event:"Found during the run")), pendingTag:!!pendingTag, at:Date.now(), status:"held"});
    note("Engram tracked: "+(it.d.n||"Engram")+(it.postmaster?" (in your Postmaster)":"")+".","ok");
  }
  if(eventNote) for(const e of run.engrams) if(e.pendingTag){ e.event = eventNote; e.pendingTag = false; }
  const opened = [];
  // engrams you owned before the run that were decrypted now: what comes out isn't run loot (rarity says which gear)
  const baseNow = now.filter(it=>base.has(it.inst)).map(it=>it.inst), baseGone = (run.engramBaseline||[]).filter(i=>!present.has(i));
  if(run._baseRarity){ opened.preRun = baseGone.map(i=>run._baseRarity[i]).filter(Boolean); }
  run._baseRarity = Object.fromEntries(now.filter(it=>base.has(it.inst)).map(it=>[it.inst, TIER[it.d.tier]||"legendary"]));
  run.engramBaseline = (run.engramBaseline||[]).filter(i=>present.has(i));
  for(const e of run.engrams) if(e.status==="held" && !e.stack && !present.has(e.inst)){ e.status = "opened"; e.openedAt = Date.now(); opened.push(e); }
  // stackable engrams (e.g. Exotic Engrams) have no instance id: track them by count per item type
  const counts = stackEngramCounts();
  if(!run.engramStackBase) run.engramStackBase = counts;
  for(const [h,n] of Object.entries(counts)){
    const d = B.defs[h], base = run.engramStackBase[h]||0, held = run.engrams.filter(e=>e.stack && e.hash==h && e.status==="held").length;
    for(let k=0; k < n - base - held; k++){
      const pendingTag = !eventNote && ((B.lastAct && B.lastAct.counted) || (B.justLeft && Date.now()-B.justLeft < 15*60000));
      run.engrams.push({inst:"stack:"+h+":"+Date.now().toString(36)+k, stack:true, hash:+h, name:(d&&d.n)||"Engram", rarity:TIER[d&&d.tier]||"exotic", event:eventNote||(pendingTag?"Current activity":(run.events.length?run.events[run.events.length-1].event:"Found during the run")), pendingTag:!!pendingTag, at:Date.now(), status:"held"});
      note("Engram tracked: "+((d&&d.n)||"Engram")+".","ok");
    }
  }
  for(const e of run.engrams.filter(e=>e.stack && e.status==="held")){
    const h = e.hash, n = counts[h]||0, base = Math.min(run.engramStackBase[h]||0, n);
    const held = run.engrams.filter(x=>x.stack && x.hash==h && x.status==="held");
    if(held.length > n - base){ e.status = "opened"; e.openedAt = Date.now(); opened.push(e); }
  }
  // fewer stacked engrams than the baseline (some pre-run ones opened): lower the baseline
  for(const h of Object.keys(run.engramStackBase)) if((counts[h]||0) < run.engramStackBase[h]) run.engramStackBase[h] = counts[h]||0;
  return opened;
}
function stackEngramCounts(){
  const out = {}, P = B.profile; if(!P) return out;
  const add = it => { if(it.itemInstanceId) return; const d = B.defs[it.itemHash]; if(d && d.t===8) out[it.itemHash] = (out[it.itemHash]||0) + (it.quantity||1); };
  ((P.profileInventory && P.profileInventory.data && P.profileInventory.data.items) || []).forEach(add);
  const ci = (P.characterInventories && P.characterInventories.data) || {};
  Object.values(ci).forEach(v=>v.items.forEach(add));
  return out;
}
B.stackEngramCounts = stackEngramCounts;
B.trackEngrams = trackEngrams;
/* Looted gear you've dismantled (gone from every character, the vault and the Postmaster) is removed from the run.
   It has to be missing on two checks in a row, so a slow profile read can't drop something by mistake. */
function pruneGone(run){
  if(!B.profile) return [];
  const removed = [];
  const check = list => list.filter(x=>{
    if(!x.inst) return true;
    if(B.whereIs(x.inst)!=="gone"){ delete x.missingSince; return true; }
    if(!x.missingSince){ x.missingSince = Date.now(); return true; }
    removed.push(x); return false;
  });
  run.weapons = check(run.weapons); run.armor = check(run.armor);
  if(removed.length){
    run.dismantled = (run.dismantled||[]).concat(removed.map(x=>({name:x.name, rarity:x.rarity, kind:x.kind, inst:x.inst, at:Date.now()})));
    (run.ownedAtStart = run.ownedAtStart||[]).push(...removed.map(x=>x.inst));   // never re-added as new loot
    note("Removed from your run (no longer in your inventory): "+removed.map(x=>x.name).join(", ")+".","");
  }
  return removed;
}
B.pruneGone = pruneGone;
/* Where is an item right now? postmaster | equipped | character | vault | other | null */
B.whereIs = inst => {
  if(!B.profile || !inst) return null;
  if(String(inst).startsWith("stack:")){
    const h = +String(inst).split(":")[1], ci = B.profile.characterInventories.data||{};
    const mine = (ci[B.charId]||{}).items||[];
    if(mine.some(i=>i.itemHash===h && i.bucketHash===215593132)) return "postmaster";
    if(mine.some(i=>i.itemHash===h)) return "character";
    for(const [cid,v] of Object.entries(ci)) if(cid!==B.charId && v.items.some(i=>i.itemHash===h)) return "other";
    if(((B.profile.profileInventory.data||{}).items||[]).some(i=>i.itemHash===h)) return "vault";
    return "gone";
  }
  const ci = B.profile.characterInventories.data||{}, ce = B.profile.characterEquipment.data||{};
  for(const [cid,v] of Object.entries(ce)) if(v.items.some(i=>i.itemInstanceId===inst)) return cid===B.charId ? "equipped" : "other";
  for(const [cid,v] of Object.entries(ci)){ const it = v.items.find(i=>i.itemInstanceId===inst); if(it) return it.bucketHash===215593132 ? (cid===B.charId ? "postmaster" : "other postmaster") : cid===B.charId ? "character" : "other"; }
  if(((B.profile.profileInventory.data||{}).items||[]).some(i=>i.itemInstanceId===inst)) return "vault";
  return "gone";
};
/* Send everything on the run character that isn't part of the run to the vault (old Postmaster gear included). */
B.clearToVault = async run => {
  if(B.busy || !B.connected()) return;
  B.busy = true; window.renderBungieSoon && window.renderBungieSoon();
  let moved = 0, skipped = 0;
  try {
    await loadDefs(); await loadProfile();
    const cid = B.charId;
    const items = allItems().filter(i=>i.owner===cid && !i.equipped && (i.d.t===2 || i.d.t===3) && !weaponAllowed(run,i) && !armorAllowed(run,i));
    for(const it of items){
      try {
        if(it.postmaster){ await api("/Destiny2/Actions/Items/PullFromPostmaster/", {method:"POST", body:{itemReferenceHash:it.hash, stackSize:1, itemId:it.inst, characterId:cid, membershipType:B.account.type}}); }
        await transfer(it, true, cid); moved++; await sleep(150);
      } catch(e){
        if(/NoRoom|VaultFull|Full/i.test((e.status||"")+(e.message||""))){ note("Your vault is full. Moved "+moved+" item"+(moved===1?"":"s")+" before it filled up.","err"); skipped = -1; break; }
        skipped++;
      }
    }
    await sleep(2500); await loadProfile();
    if(skipped>=0) note(moved ? "Moved "+moved+" item"+(moved===1?"":"s")+" that aren't part of the run to your vault"+(skipped?" ("+skipped+" couldn't be moved)":"")+"." : "Nothing to move: your "+run.cls+" only carries run gear.", moved?"ok":"");
  } catch(e){ note(friendly(e),"err"); }
  finally { B.busy = false; window.render && window.render(); }
};
/* Pull every looted item waiting in the run character's Postmaster */
B.pullPostmaster = async run => {
  if(B.busy || !B.connected()) return;
  B.busy = true; window.renderBungieSoon && window.renderBungieSoon();
  let n = 0;
  try {
    await loadProfile();
    const inv = (B.profile.characterInventories.data[B.charId]||{}).items||[];
    const looted = new Set(run.weapons.concat(run.armor).map(x=>x.inst).concat((run.engrams||[]).filter(e=>e.status==="held").map(e=>e.inst)).filter(Boolean));
    const stackHeld = new Set((run.engrams||[]).filter(e=>e.stack && e.status==="held").map(e=>e.hash));
    for(const it of inv.filter(i=>i.bucketHash===215593132 && !i.itemInstanceId && stackHeld.has(i.itemHash))){
      try { await api("/Destiny2/Actions/Items/PullFromPostmaster/", {method:"POST", body:{itemReferenceHash:it.itemHash, stackSize:it.quantity||1, itemId:"0", characterId:B.charId, membershipType:B.account.type}}); n++; await sleep(300); } catch(e){}
    }
    for(const it of inv.filter(i=>i.bucketHash===215593132 && looted.has(i.itemInstanceId))){
      await api("/Destiny2/Actions/Items/PullFromPostmaster/", {method:"POST", body:{itemReferenceHash:it.itemHash, stackSize:1, itemId:it.itemInstanceId, characterId:B.charId, membershipType:B.account.type}});
      n++; await sleep(300);
    }
    await sleep(2500); await loadProfile();
    note(n ? "Pulled "+n+" item"+(n>1?"s":"")+" (loot and engrams) from the Postmaster." : "No run loot or engrams in your Postmaster.", n?"ok":"");
  } catch(e){ note(friendly(e),"err"); }
  finally { B.busy = false; window.render && window.render(); }
};
B.equippedLoot = run => {
  if(!B.profile || !B.charId) return [];
  const eq = ((B.profile.characterEquipment.data[B.charId]||{}).items||[]).map(i=>i.itemInstanceId);
  return run.weapons.concat(run.armor).filter(x=>x.inst && eq.includes(x.inst)).map(x=>x.inst);
};

/* Seasonal artifact: Bungie lets apps read perks (per character) but not change them. */
B.artifact = null;
/* Ability descriptions (aspects, fragments, abilities, artifact perks) from the public manifest, cached in localStorage. */
const DESC_KEY = "d2r.desc5";
const STAT_NAME = {144602215:"Super",392767087:"Health",1735777505:"Grenade",1943323491:"Class",2996146975:"Weapons",4244567218:"Melee"};
B.desc = (()=>{ try { return JSON.parse(localStorage.getItem(DESC_KEY))||{}; } catch(e){ return {}; } })();
// drop blank entries saved by a failed lookup (before Nov 10), so they load again
for(const h of Object.keys(B.desc)){ const v = B.desc[h]; if(v && !v.d) delete B.desc[h]; }
const descBusy = new Set();
const descFailed = {};
B.describe = async hashes => {
  const now = Date.now();
  const todo = [...new Set(hashes.filter(h=>h && !B.desc[h] && !descBusy.has(h) && !(descFailed[h] > now - 60000)))];   // failed lookups wait a minute before retrying
  if(!todo.length) return 0;
  todo.forEach(h=>descBusy.add(h));
  let i = 0, got = 0;
  const one = async h => {
    const d = await fullDef(h);
    const texts = []; let perkFail = null;
    for(const pk of d.perks||[]){
      // visibility 0 = shown, 1 = shown on some aspects (e.g. Crackshot), 2 = stat lines like "-10 Class"
      if(pk.perkVisibility===2) continue;
      try { const sp = await api(`/Destiny2/Manifest/DestinySandboxPerkDefinition/${pk.perkHash}/`), dp = sp.displayProperties||{}, t = dp.description;
        if(t && (pk.perkVisibility===0 || sp.isDisplayable) && t!==dp.name && !texts.includes(t)) texts.push(t); } catch(e){ perkFail = e; }
    }
    if(!texts.length && d.displayProperties && d.displayProperties.description) texts.push(d.displayProperties.description);
    if(perkFail && !texts.length) throw perkFail;   // don't save a blank description: try again later
    const st = d.investmentStats||[];
    const cap = (st.find(x=>x.statTypeHash===2223994109)||{}).value;
    const stats = st.filter(x=>x.value && STAT_NAME[x.statTypeHash]).map(x=>(x.value>0?"+":"")+x.value+" "+STAT_NAME[x.statTypeHash]);
    B.desc[h] = {n:(d.displayProperties||{}).name||"", i:(d.displayProperties||{}).icon||"", d:texts.join(" "), s:stats, cap:cap||null};
    got++;
  };
  let fail = null;
  await Promise.all(Array.from({length:Math.min(6,todo.length)}, async()=>{ while(i<todo.length){ const h = todo[i++]; try { await one(h); } catch(e){ fail = e; } descBusy.delete(h); } }));
  // a lookup that fails (e.g. the API key's allowed origin doesn't match this address) shows a message instead of "Loading…" forever
  if(fail && !got){
    todo.forEach(h=>{ if(!B.desc[h]) descFailed[h] = Date.now(); });
    const first = !B.descError; B.descError = (fail && fail.message) || "Bungie.net didn't answer.";
    if(first) console.warn("Ability descriptions unavailable:", B.descError);
    return first ? 1 : 0;   // re-render once to show the message, never in a loop
  }
  B.descError = null;
  try { localStorage.setItem(DESC_KEY, JSON.stringify(B.desc)); } catch(e){}
  return got;
};
/* The equipped artifact is an item in the artifact bucket; sockets 0-6 hold its mods (socket 7 is reset). */
const ARTIFACT_BUCKET = 1506418338, EMPTY_ART_MOD = 1235188590;
B.loadArtifact = async () => {
  if(!B.connected() || !B.charId) return null;
  try {
    const a = B.account;
    const c = await api(`/Destiny2/${a.type}/Profile/${a.id}/Character/${B.charId}/?components=205,305`);
    const it = (c.equipment && c.equipment.data && c.equipment.data.items || []).find(i=>i.bucketHash===ARTIFACT_BUCKET);
    if(!it){ B.artifact = null; return null; }
    const d = await fullDef(it.itemHash);
    const socks = (c.itemComponents && c.itemComponents.sockets && c.itemComponents.sockets.data || {})[it.itemInstanceId];
    const slots = [];
    for(let i=0;i<7;i++){ const p = socks && socks.sockets[i] && socks.sockets[i].plugHash; slots.push(p && p!==EMPTY_ART_MOD ? p : null); }
    B.artifact = {hash:it.itemHash, inst:it.itemInstanceId, name:d.displayProperties.name, slots, charId:B.charId, at:Date.now()};
    B.describe(slots.filter(Boolean)).then(n=>{ if(n && window.render) window.render(); });
    return B.artifact;
  } catch(e){ return B.artifact; }
};

/* Equip the run's artifact and put its mods in, on the run's character. Artifacts are instanced items
   (one copy per character, in bucket 1506418338). Mods go in with InsertSocketPlugFree if Bungie allows it. */
B.applyArtifact = async (run, {quiet}={}) => {
  if(!B.connected() || !B.charId || !run || !run.artifact) return false;
  const want = (window.ARTIFACTS||[]).find(x=>x.n===run.artifact.n); if(!want) return false;
  try {
    const a = B.account;
    let live = await B.loadArtifact();
    if(!live || live.name!==want.n){
      const c = await api(`/Destiny2/${a.type}/Profile/${a.id}/Character/${B.charId}/?components=201`);
      const it = (c.inventory && c.inventory.data && c.inventory.data.items || []).find(i=>i.itemHash===want.h && i.itemInstanceId);
      if(!it){ if(!quiet) note(want.n+" isn't on this character. Unlock it in game first.","err"); return false; }
      await api("/Destiny2/Actions/Items/EquipItem/", {method:"POST", body:{itemId:it.itemInstanceId, characterId:B.charId, membershipType:a.type}});
      await sleep(800);
      live = await B.loadArtifact();
    }
    let modsOk = true, changed = 0;
    for(let i=0;i<7;i++){
      const m = run.artSlots && run.artSlots[i], target = m ? m.h : EMPTY_ART_MOD, cur = live && live.slots[i] || EMPTY_ART_MOD;
      if(cur===target) continue;
      try { await insertPlug(live.inst, B.charId, i, target); changed++; }
      catch(e){ modsOk = false; if(needsOrbit(e)) B.pendingOrbit = true; }
    }
    if(changed) await B.loadArtifact();
    if(!quiet) note(modsOk ? "Artifact set: "+want.n+(changed?" with "+changed+" mod change"+(changed>1?"s":""):"")+"." : "Equipped "+want.n+", but Bungie wouldn't change its mods from here. Set them in game.", modsOk?"ok":"err");
    window.render && window.render();
    return modsOk;
  } catch(e){ if(needsOrbit(e)) B.pendingOrbit = true; if(!quiet) note(friendly(e),"err"); return false; }
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
    const counted = info && (info.type===DUNGEON_TYPE || (run.mode!=="dungeon" && !!classify(info, {activityDetails:{mode:ca.currentActivityModeType, modes:ca.currentActivityModeTypes||[]}})));
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
