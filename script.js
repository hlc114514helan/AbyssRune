<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">

<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">

<title>深淵符文 | 神裝覺醒</title>

<link rel="stylesheet" href="style.css">
<script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
</head>
<body>
<div id="start-screen" class="minimal-menu-overlay">
    <button class="minimal-start-btn" onclick="handleStartGame()">開始遊戲</button>
</div>
<audio id="audio-menu" src="menu.mp3" loop style="display:none;"></audio>
<audio id="audio-battle" src="battle.mp3" loop style="display:none;"></audio>
<audio id="audio-victory" src="victory.mp3" style="display:none;"></audio>
<div class="wrap">
<div class="panel">
<h2>🧍 英雄</h2>
<button id="equipmentBtn" class="btn" onclick="openEquipmentModal()">⚔️ 裝備管理</button>
<button class="btn" style="background: #4a2c6d; border-color: #9b5de5; margin-top: 8px;" onclick="openP2PModal()">⚔️ 跨時空聯機競技場</button>
<div id="equipStatus" class="equip-summary">🔒 裝備未解鎖 (100層+5000石)</div>
<button id="unlockEquipmentBtn" class="btn" style="background:#aa6633; display:none;" onclick="unlockEquipment()">🔓 解鎖裝備 (5000石)</button>
<div class="stat">❤️ HP：<span id="hp"></span>/<span id="maxHp"></span></div>
<div class="hpbar"><div id="playerHpFill" class="hpfill playerhp"></div></div>
<div class="stat">⚡ 能量：<span id="energy"></span>/<span id="maxEnergy"></span></div>
<div class="stat">🛡️ 護甲：<span id="block"></span></div>
<div class="stat">💰 魂石：<span id="gold"></span></div>
<div class="stat">🏔️ 樓層：<span id="floor"></span></div>
<div class="stat">☠️ 中毒：<span id="poison"></// ==========================================
// 音效管理器 (Audio Manager) - 核心實作
// ==========================================
const AudioManager = {
    bgm: null,
    currentTrack: '',
    // 從瀏覽器快取讀取先前的設定，若無則預設不靜音、音量 0.5
    isMuted: localStorage.getItem('game_muted') === 'true',
    volume: localStorage.getItem('game_volume') !== null ? parseFloat(localStorage.getItem('game_volume')) : 0.5,

    // 音訊檔案對照表 (確保路徑與你的實體檔案位置一致)
    tracks: {
        menu: 'menu.mp3',
        battle: 'battle.mp3',
        victory: 'victory.mp3'
    },

    // 初始化狀態
    init() {
        this.updateUI();
        
        // 當玩家第一次點擊畫面的任何地方時，嘗試自動啟動主選單音樂（破解瀏覽器自動播放限制）
        const unlockAutoplay = () => {
            if (!this.bgm) {
                this.playBGM('menu');
            }
            document.removeEventListener('click', unlockAutoplay);
        };
        document.addEventListener('click', unlockAutoplay);
    },

    // 切換背景音樂歌曲
    playBGM(trackKey) {
        const src = this.tracks[trackKey];
        if (!src) return;

        // 如果目前正在播放同一首歌，就不重複觸發
        if (this.currentTrack === trackKey && this.bgm && !this.bgm.paused) {
            return;
        }

        // 停止並清除舊的背景音樂
        this.stopBGM();

        this.currentTrack = trackKey;
        this.bgm = new Audio(src);
        this.bgm.loop = (trackKey !== 'victory'); // 如果不是 victory 就循環播放，是 victory 就不循環
        this.bgm.volume = this.isMuted ? 0 : this.volume;

        // 執行播放
        this.bgm.play().catch(err => {
            console.log("預期行為：等待玩家點擊畫面後即刻啟動音訊。");
        });
    },

    // 停止目前音樂
    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
        }
    },

    // 調整音量大小
    setVolume(val) {
        this.volume = parseFloat(val);
        localStorage.setItem('game_volume', this.volume);
        
        if (this.bgm && !this.isMuted) {
            this.bgm.volume = this.volume;
        }
    },

    // 切換開關靜音
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('game_muted', this.isMuted);
        
        if (this.bgm) {
            this.bgm.volume = this.isMuted ? 0 : this.volume;
        }
        this.updateUI();
    },

    // 同步更新前端按鈕與拉桿的視覺狀態
    updateUI() {
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (muteBtn) {
            muteBtn.innerText = this.isMuted ? "🔇 音效：關" : "🔊 音效：開";
            muteBtn.style.background = this.isMuted ? "#553333" : "";
        }
        if (volumeSlider) {
            volumeSlider.value = this.isMuted ? 0 : this.volume;
        }
    }
};

// 確保網頁 DOM 載入完畢後立刻初始化音效設定
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AudioManager.init());
} else {
    AudioManager.init();
}
// ================= 完整遊戲資料庫 =================
const baseCardPool = [ {name:"打擊",type:"atk",dmg:6,cost:1,rarity:"common",desc:"造成6傷害"},{name:"防禦",type:"block",block:6,cost:1,rarity:"common",desc:"獲得6護甲"},{name:"集中",type:"energy",gain:1,draw:1,cost:0,rarity:"rare",once:true,desc:"+1能量 抽1張"},{name:"毒刃",type:"poison",dmg:5,poison:6,cost:1,rarity:"rare",desc:"造成5傷害並施加6中毒"},];
const existingExtraCardPool = [ {name:"重擊",type:"atk",dmg:14,cost:2,rarity:"rare",desc:"造成14傷害"},{name:"雙連擊",type:"multi",hits:2,dmg:5,cost:1,rarity:"rare",desc:"攻擊2次"},{name:"鐵壁",type:"block",block:16,cost:2,rarity:"rare",desc:"獲得16護甲"},{name:"破甲",type:"vul",vulnerable:2,cost:1,rarity:"epic",desc:"施加2層易傷"},{name:"狂怒",type:"buff",strength:2,cost:1,rarity:"epic",desc:"獲得2力量"},{name:"風暴斬",type:"multi",hits:4,dmg:4,cost:2,rarity:"epic",desc:"攻擊4次"},{name:"終焉",type:"atk",dmg:36,cost:3,rarity:"legend",desc:"造成36傷害"}];
const drawOnlyCardPool = [ {name:"連擊",type:"multi",hits:3,dmg:3,cost:1,rarity:"common",desc:"造成3傷害3次",price:45},{name:"戰意",type:"buff",strength:2,cost:1,rarity:"common",desc:"獲得2力量",price:50},{name:"毒爆",type:"poisonburst",cost:2,rarity:"rare",desc:"引爆所有中毒",price:55},{name:"終焉斬",type:"atk",dmg:40,cost:4,rarity:"epic",desc:"造成40傷害",price:60},{name:"時空扭曲",type:"energy",gain:3,draw:2,cost:0,rarity:"epic",desc:"+3能量並抽2張",price:80},{name:"深淵降臨",type:"percentdmg",percent:0.5,cost:5,rarity:"legend",desc:"造成敵人50%最大生命傷害",price:95},{name:"無限輪迴",type:"fullheal",cost:3,rarity:"legend",desc:"回滿生命並抽滿手牌",price:130},{name:"治癒術",type:"heal",heal:8,cost:1,rarity:"common",desc:"恢復8生命",price:35},{name:"盾擊",type:"atkblock",dmg:8,block:8,cost:1,rarity:"common",desc:"造成8傷害並獲得8護甲",price:40},{name:"吸血斬",type:"lifesteal",dmg:12,heal:6,cost:2,rarity:"rare",desc:"造成12傷害並恢復6生命",price:60},{name:"狂暴",type:"buff",strength:5,cost:2,rarity:"epic",desc:"獲得5力量",price:70},{name:"風暴連斬",type:"multi",hits:6,dmg:4,cost:3,rarity:"epic",desc:"攻擊6次",price:80},{name:"神之怒",type:"atk",dmg:100,cost:6,rarity:"legend",desc:"造成100傷害",price:85},{name:"滅世風暴",type:"multi",hits:10,dmg:8,cost:5,rarity:"legend",desc:"攻擊10次",price:120},{name:"聖光治療",type:"heal",heal:20,cost:2,rarity:"rare",desc:"恢復20生命",price:60},{name:"生命虹吸",type:"lifesteal",dmg:20,heal:10,cost:3,rarity:"epic",desc:"造成20傷害並恢復10生命",price:80},{name:"暴風劍雨",type:"multi",hits:12,dmg:5,cost:5,rarity:"legend",desc:"攻擊12次",price:140},{name:"審判之劍",type:"atk",dmg:150,cost:8,rarity:"legend",desc:"造成150傷害",price:160},{name:"奇蹟恢復",type:"fullheal",cost:4,rarity:"legend",desc:"完全恢復生命",price:180},{name:"超載魔力",type:"energy",gain:5,draw:3,cost:0,rarity:"legend",desc:"+5能量並抽3張",price:170}];
const curseCardPool = [ { name:"疲勞詛咒", type:"curse", cost:0, rarity:"curse", desc:"每回合抽牌數 -1", effect:()=>{ state.drawReduce = (state.drawReduce || 0) + 1; log("😫 疲勞詛咒：每回合抽牌數 -1"); }, once:true }, { name:"脆弱詛咒", type:"curse", cost:0, rarity:"curse", desc:"每回合開始時受到 3 傷害", effect:()=>{ state.curseDamage = (state.curseDamage || 0) + 3; log("💔 脆弱詛咒：每回合受到 3 傷害"); }, once:true }, { name:"貪婪詛咒", type:"curse", cost:0, rarity:"curse", desc:"商店價格 +20%", effect:()=>{ state.shopDiscount = (state.shopDiscount || 1) * 1.2; log("💰 貪婪詛咒：商店價格 +20%"); }, once:true } ];
const hiddenCardPool = { paladin: [{name:"制裁",type:"atk",dmg:75,cost:3,rarity:"legend",desc:"造成75傷害並施加20易傷", vulnerable:20},{name:"聖光術",type:"heal",heal:60,cost:2,rarity:"legend",desc:"恢復60生命"}], ranger: [{name:"連射",type:"multi",hits:2,dmg:35,cost:2,rarity:"legend",desc:"造成35傷害2次"},{name:"陷阱",type:"debuff",cost:3,rarity:"legend",desc:"敵人下回合攻擊 -50%", effect:()=>{ if(state.enemy) state.enemy.nextTurnAtkMod = 0.5; log("🗡️ 陷阱生效，下回合敵人攻擊減半"); }}], vampire: [{name:"緋紅之噬",type:"lifesteal",dmg:80,heal:30,cost:3,rarity:"legend",desc:"造成80傷害並恢復30生命"},{name:"紅蓮解體",type:"atk",dmg:300,cost:9,rarity:"legend",desc:"造成300傷害"}] };
const relicPool = [ {name:"尖刺護甲",desc:"被攻擊時反傷20%",rarity:"common",weight:8,effect:(type,dmg)=>{if(type==="hit"&&state.enemy){let thorns=Math.max(1,Math.floor(dmg*0.2));state.enemy.hp-=thorns;log(`🩸 尖刺護甲反傷 ${thorns}`);}}}, {name:"遠古卷軸",desc:"每回合額外抽1張牌",rarity:"common",weight:8,turnStart:()=>draw(1)}, {name:"力量護符",desc:"永久獲得20力量",rarity:"common",weight:8,onGet:()=>{state.strength+=20;log("💪 力量護符 +20 力量");}}, {name:"生命水晶",desc:"最大生命+10",rarity:"common",weight:8,onGet:()=>{state.maxHp+=10;state.hp+=10;log("❤️ 最大生命 +10");}}, {name:"魔力核心",desc:"最大能量 +1",rarity:"rare",weight:3,onGet:()=>{state.maxEnergy++; log("✨ 最大能量 +1");},battleStart:()=>{}}, {name:"鮮血戒指",desc:"攻擊後恢復10生命",rarity:"rare",weight:3,effect:(type)=>{if(type==="attack"){heal(10);}}}, {name:"毒蛇雕像",desc:"每回合開始時對敵人施加30中毒",rarity:"rare",weight:3,turnStart:()=>{if(state.enemy){state.enemy.poison+=30;log("🐍 毒蛇雕像施加30中毒");}}}, {name:"幸運幣",desc:"商店價格降低10%",rarity:"rare",weight:3,onGet:()=>{state.shopDiscount=0.9;log("💰 商店價格 -10%");}}, {name:"龍心",desc:"最大生命+25",rarity:"epic",weight:1,onGet:()=>{state.maxHp+=25;state.hp+=25;log("❤️ 龍心 +25 最大生命");}}, {name:"風暴披風",desc:"每回合開始時獲得20護甲",rarity:"epic",weight:1,turnStart:()=>{state.block+=20;log("🌬️ 風暴披風 +20 護甲");}}, {name:"時間沙漏",desc:"每場戰鬥首回合 +2 能量",rarity:"epic",weight:1,battleStart:()=>{state.firstTurnBonusEnergy = (state.firstTurnBonusEnergy||0)+2;log("⏳ 首回合額外 +2 能量");}}, {name:"巨龍之心",desc:"每回合開始獲得 20 力量（戰鬥內）",rarity:"epic",weight:1,turnStart:()=>{state.tempStrength = (state.tempStrength||0)+20; log("🐉 巨龍之心：本回合力量 +20");}}, {name:"刺客斗篷",desc:"暴擊傷害提升至 2 倍",rarity:"epic",weight:1,onGet:()=>{state.critBonusMult=2; log("🗡️ 刺客斗篷：暴擊傷害變為 2 倍");}}, {name:"法師之眼",desc:"每回合額外抽 1 張牌（限一次）",rarity:"epic",weight:1,turnStart:()=>{state.extraDrawUsed=false; log("👁️ 法師之眼：本回合可額外抽一張牌");}}, {name:"聖騎士徽章",desc:"每回合開始時恢復 30 生命",rarity:"epic",weight:1,turnStart:()=>{heal(30); log("🛡️ 聖騎士徽章：恢復 30 生命");}}, {name:"吸血鬼之牙",desc:"吸血比例 +10%",rarity:"epic",weight:1,onGet:()=>{state.vampireHealBonus=(state.vampireHealBonus||0)+0.1; log("🦇 吸血鬼之牙：吸血比例增加 10%");}} ];

// ========= 稀有度裝備系統 =========
const RARITY = { common:0, rare:1, epic:2, legend:3 };
const RARITY_NAME = ["普通","稀有","史詩","傳說"];
const RARITY_COST = [0, 5000, 8000, 10000];
const EQUIP_STATS = {
    weapon: { strength: [60, 150, 300, 500] },
    armor:  { maxHp: [100, 200, 350, 550] },
    pants:  { maxHp: [50, 100, 180, 300] },
    boots:  { strength: [2, 8, 18, 35] }
};
function getEquipStatsByRarity(slot, rarityIndex){
    let stat = EQUIP_STATS[slot];
    if(!stat) return {};
    let result = {};
    if(stat.strength) result.strength = stat.strength[rarityIndex];
    if(stat.maxHp) result.maxHp = stat.maxHp[rarityIndex];
    return result;
}
function getUpgradeCost(currentRarity){ if(currentRarity >= 3) return -1; return RARITY_COST[currentRarity+1]; }
function upgradeEquipmentRarity(slot){
    if(!state.equipmentUnlocked){ log("裝備系統未解鎖"); return false; }
    let equip = state.equipment[slot];
    if(!equip){ log(`尚未購買${slot}裝備`); return false; }
    let currentIdx = equip.rarity;
    if(currentIdx >= 3){ log("已達傳說品質，無法再升級"); return false; }
    let cost = getUpgradeCost(currentIdx);
    if(state.gold < cost){ log(`魂石不足 ${cost}`); return false; }
    state.gold -= cost;
    let oldStats = getEquipStatsByRarity(slot, currentIdx);
    if(oldStats.strength) state.strength -= oldStats.strength;
    if(oldStats.maxHp) { state.maxHp -= oldStats.maxHp; if(state.hp > state.maxHp) state.hp = state.maxHp; }
    equip.rarity++;
    let newStats = getEquipStatsByRarity(slot, equip.rarity);
    if(newStats.strength) state.strength += newStats.strength;
    if(newStats.maxHp) { state.maxHp += newStats.maxHp; state.hp += newStats.maxHp; }
    log(`✨ ${slot==="weapon"?"武器":slot==="armor"?"衣服":slot==="pants"?"褲子":"鞋子"} 升級為 ${RARITY_NAME[equip.rarity]}！`);
    renderEquipmentModal();
    render();
    return true;
}
function purchaseEquipment(slot){
    if(!state.equipmentUnlocked){ log("裝備系統未解鎖"); return; }
    if(state.equipment[slot]){ log(`已經有${slot}裝備，請先卸下`); return; }
    if(state.gold < 1000){ log("魂石不足 1000"); return; }
    state.gold -= 1000;
    state.equipment[slot] = { name: slot==="weapon"?"⚔️武器":slot==="armor"?"🧥衣服":slot==="pants"?"👖褲子":"👟鞋子", rarity: 0 };
    let stats = getEquipStatsByRarity(slot, 0);
    if(stats.strength) state.strength += stats.strength;
    if(stats.maxHp) { state.maxHp += stats.maxHp; state.hp += stats.maxHp; }
    log(`🛡️ 購買並裝備 ${state.equipment[slot].name} (普通)`);
    render();
}
function unequipItem(slot){
    if(!state.equipmentUnlocked) return;
    let equip = state.equipment[slot];
    if(!equip) return;
    let stats = getEquipStatsByRarity(slot, equip.rarity);
    if(stats.strength) state.strength -= stats.strength;
    if(stats.maxHp) { state.maxHp -= stats.maxHp; if(state.hp > state.maxHp) state.hp = state.maxHp; }
    state.equipment[slot] = null;
    log(`🔧 卸下 ${slot} 裝備`);
    render();
}
function unlockEquipment(){
    if(state.equipmentUnlocked){ log("裝備已解鎖"); return; }
    if(state.floor < 100){ log("需要達到 100 層才能解鎖裝備"); return; }
    if(state.gold < 5000){ log("魂石不足 5000"); return; }
    state.gold -= 5000;
    state.equipmentUnlocked = true;
    log("🔓 裝備系統已解鎖！現在可以購買裝備並用魂石提升稀有度（普通→稀有5000石→史詩8000石→傳說10000石）");
    render();
    if(document.getElementById("equipmentModal").style.display === "flex") renderEquipmentModal();
}
function openEquipmentModal(){
    if(!state.equipmentUnlocked){
        let container = document.getElementById("equipmentSlots");
        container.innerHTML = `<div style="text-align:center; padding:20px;"><p>🔒 裝備系統尚未解鎖</p><p>需要達到 100 層並花費 5000 魂石</p><button class="btn" onclick="unlockEquipment(); closeEquipmentModal();">立即解鎖 (5000石)</button><button class="btn" onclick="closeEquipmentModal()">取消</button></div>`;
        document.getElementById("equipmentModal").style.display = "flex";
        return;
    }
    renderEquipmentModal();
    document.getElementById("equipmentModal").style.display = "flex";
}
function closeEquipmentModal(){ document.getElementById("equipmentModal").style.display = "none"; }
function renderEquipmentModal(){
    let container = document.getElementById("equipmentSlots");
    if(!container) return;
    let slots = ["weapon","armor","pants","boots"];
    let html = "";
    for(let slot of slots){
        let equip = state.equipment[slot];
        let has = !!equip;
        let rarityIdx = has ? equip.rarity : 0;
        let stats = has ? getEquipStatsByRarity(slot, rarityIdx) : {};
        let statsText = "";
        if(stats.strength) statsText += `力量 +${stats.strength} `;
        if(stats.maxHp) statsText += `最大生命 +${stats.maxHp} `;
        let rarityName = has ? RARITY_NAME[rarityIdx] : "未購買";
        let nextCost = has ? getUpgradeCost(rarityIdx) : -1;
        let canUpgrade = has && (nextCost !== -1) && (state.gold >= nextCost);
        let upgradeBtn = "";
        if(has){
            if(nextCost !== -1){
                upgradeBtn = `<button class="btn upgrade-btn" onclick="upgradeEquipmentRarity('${slot}'); renderEquipmentModal();" ${!canUpgrade ? "disabled" : ""}>⬆️ 升級至${RARITY_NAME[rarityIdx+1]} (${nextCost}石)</button>`;
            } else {
                upgradeBtn = `<button class="btn" disabled>⭐ 已傳說</button>`;
            }
        }
        let buyOrUnequip = "";
        if(has){
            buyOrUnequip = `<button class="btn" onclick="unequipItem('${slot}'); closeEquipmentModal();">卸下</button>`;
        } else {
            buyOrUnequip = `<button class="btn" onclick="purchaseEquipment('${slot}'); closeEquipmentModal();">購買 (1000石)</button>`;
        }
        let name = has ? `${equip.name} (${rarityName})` : (slot==="weapon"?"⚔️武器":slot==="armor"?"🧥衣服":slot==="pants"?"👖褲子":"👟鞋子");
        let rarityColor = has ? (rarityIdx===0?"#9ca3af":rarityIdx===1?"#3b82f6":rarityIdx===2?"#c026d3":"#facc15") : "#aaa";
        html += `<div class="slot-item"><div class="slot-name" style="color:${rarityColor};">${name}</div><div class="slot-stats">${statsText || "無屬性"}</div><div class="slot-rarity">${has?`稀有度：${rarityName}`:"未購買"}</div><div style="display:flex; gap:8px; margin-top:8px;">${buyOrUnequip} ${upgradeBtn}</div></div>`;
    }
    container.innerHTML = html;
}

// ================= 遊戲核心狀態 =================
let state = {
hp:80,maxHp:80,energy:3,maxEnergy:3,block:0,gold:60,floor:1,job:"warrior",strength:0,poison:0,
deck:[],hand:[],discard:[],enemy:null,map:[],relics:[],inBattle:false,usedOnceCards:[],unlockedCardNames:[],
ownedCardNames:[],
shopDiscount:1,evolutionPoints:0,evolved:false,permanentStrength:0,gameStarted:false,
firstTurnBonusEnergy:0,firstTurnOfBattle:true,rangerFirstAttackFree:false,
vampireHealRatio:0.4,tempStrength:0,extraDrawUsed:false,critBonusMult:1.5,vampireHealBonus:0,
drawReduce:0,curseDamage:0,equipmentUnlocked:false,equipment:{ weapon: null, armor: null, pants: null, boots: null },
blackMarketCards: null,
shopCards: null,
};
// 辅助函数
function copyCardFromPool(pool,name){ let c=pool.find(x=>x.name===name); return JSON.parse(JSON.stringify(c)); }
function copyCard(card){ return JSON.parse(JSON.stringify(card)); }
function shuffle(arr){ let a=[...arr]; for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function log(text){ let div=document.createElement("div");div.innerHTML=text;document.getElementById("log").prepend(div);while(document.getElementById("log").children.length>80) document.getElementById("log").removeChild(document.getElementById("log").lastChild); }
function heal(v){ state.hp=Math.min(state.maxHp,state.hp+v); }
function getNormalCards(){ return [...baseCardPool, ...existingExtraCardPool]; }
function getUnlockedCardObjects(){ return state.unlockedCardNames.map(name=>{let card=drawOnlyCardPool.find(c=>c.name===name); if(card) return copyCard(card); return null;}).filter(c=>c!==null); }
function getInitialDeck(){ let deck=[]; for(let i=0;i<5;i++) deck.push(copyCardFromPool(baseCardPool,"打擊")); for(let i=0;i<5;i++) deck.push(copyCardFromPool(baseCardPool,"防禦")); if(state.job==="mage") deck.push(copyCardFromPool(baseCardPool,"集中")); if(state.job==="assassin") deck.push(copyCardFromPool(baseCardPool,"毒刃")); if(state.job==="paladin"){ deck.push(copyCard(hiddenCardPool.paladin[0])); deck.push(copyCard(hiddenCardPool.paladin[1]));} else if(state.job==="ranger"){ deck.push(copyCard(hiddenCardPool.ranger[0])); deck.push(copyCard(hiddenCardPool.ranger[1]));} else if(state.job==="vampire"){ deck.push(copyCard(hiddenCardPool.vampire[0])); deck.push(copyCard(hiddenCardPool.vampire[1]));} return shuffle(deck); }
function getBaseJobStats(){ let baseHp=100, baseEnergy=4; if(state.job==="warrior"){ baseHp=120; baseEnergy=4; } else if(state.job==="mage"){ baseHp=100; baseEnergy=5; } else if(state.job==="assassin"){ baseHp=100; baseEnergy=4; } else if(state.job==="paladin"){ baseHp=150; baseEnergy=4; } else if(state.job==="ranger"){ baseHp=120; baseEnergy=4; } else if(state.job==="vampire"){ baseHp=130; baseEnergy=5; } return {baseHp, baseEnergy}; }
function applyEvolution(){ let {baseHp, baseEnergy}=getBaseJobStats(); if(state.evolved){ switch(state.job){ case "warrior": baseHp=350; baseEnergy=7; break; case "mage": baseHp=250; baseEnergy=8; break; case "assassin": baseHp=300; baseEnergy=4; break; case "paladin": baseHp=400; baseEnergy=4; break; case "ranger": baseHp=350; baseEnergy=4; break; case "vampire": baseHp=350; baseEnergy=5; break; } } return {baseHp,baseEnergy}; }
function setJob(job,keepProgress=false){ if(!keepProgress && state.gameStarted && !(job==="paladin"||job==="ranger"||job==="vampire")){ log("❌ 遊戲已開始，無法更換基礎職業！"); return; } state.job=job; if(!keepProgress){ state.evolved=false; state.evolutionPoints=0; state.permanentStrength=0; state.strength=0; state.relics=[]; state.unlockedCardNames=[]; state.shopDiscount=1; let {baseHp,baseEnergy}=getBaseJobStats(); state.maxHp=baseHp; state.maxEnergy=baseEnergy; state.hp=state.maxHp; state.energy=state.maxEnergy; state.block=0; state.poison=0; state.deck=getInitialDeck(); state.hand=[]; state.discard=[]; state.drawReduce=0; state.curseDamage=0; state.equipmentUnlocked=false; state.equipment={ weapon: null, armor: null, pants: null, boots: null }; state.blackMarketCards=null; state.shopCards=null; }else{ let {baseHp,baseEnergy}=getBaseJobStats(); state.maxHp=Math.max(state.maxHp,baseHp); state.maxEnergy=Math.max(state.maxEnergy,baseEnergy); state.hp=Math.min(state.hp,state.maxHp); state.energy=Math.min(state.energy,state.maxEnergy); let newCards=[]; if(job==="paladin") newCards=hiddenCardPool.paladin; else if(job==="ranger") newCards=hiddenCardPool.ranger; else if(job==="vampire") newCards=hiddenCardPool.vampire; for(let card of newCards) if(!state.deck.some(c=>c.name===card.name)) state.deck.push(copyCard(card)); state.rangerFirstAttackFree=false; } generateMap(); render(); log(`🎭 切換職業：${job}${keepProgress?"（保留進度）":""}`); }
function generateMap(){ let map = [ {type:"戰鬥",done:false},{type:"戰鬥",done:false},{type:"精英",done:false},{type:"商店",done:false}, {type:Math.random()<0.5?"休息":"寶箱",done:false},{type:Math.random()<0.5?"休息":"寶箱",done:false} ]; let eventIndex = Math.floor(Math.random() * 2); map[eventIndex] = {type:"事件", done:false}; if(Math.random() < 0.2 && map[1].type === "戰鬥") map[1] = {type:"事件", done:false}; if(state.floor % 5 === 0){ let bossIdx = Math.floor(Math.random() * map.length); map[bossIdx] = {type:"Boss", done:false}; } state.map = shuffle(map); state.blackMarketCards = null; state.shopCards = null; }
function spawnEnemy(rank){
    // 🎵 【音效觸發】切換至戰鬥音樂
    if (typeof AudioManager !== 'undefined') AudioManager.playBGM('battle');

    state.inBattle = true;
    let hp = 40 + state.floor * 8, atk = 6 + state.floor;
    if(rank === "elite"){ hp *= 1.8; atk *= 1.5; }
    if(rank === "boss"){ hp *= 3; atk *= 2.2; }

    let name = (rank === "boss") ? "終焉魔王" : (rank === "elite" ? "深淵精英" : "深淵怪物");
    let bossType = null;
    let invisible = false;

    if(rank === "boss"){
        let cycle = Math.floor(state.floor / 10) % 3;
        if(cycle === 0){
            name = "🌳 腐化樹精";
            bossType = "treant";
        } else if(cycle === 1){
            name = "🗡️ 暗影刺客";
            bossType = "assassin";
            invisible = true;
        } else {
            name = "⏳ 時間領主";
            bossType = "timelord";
        }
    }

    state.enemy = {
        name: name,
        rank: rank,
        hp: Math.floor(hp),
        maxHp: Math.floor(hp),
        atk: Math.floor(atk),
        poison: 0,
        vulnerable: 0,
        rage: false,
        bossType: bossType,
        invisible: invisible,
        turnCounter: 0
    };
    state.summonedMinion = null;

    state.hand = [];
    state.discard = [];
    state.deck = shuffle(state.deck);
    state.usedOnceCards = [];
    state.firstTurnOfBattle = true;
    state.firstTurnBonusEnergy = 0;
    state.energy = state.maxEnergy;

    for(let r of state.relics) if(r.battleStart) r.battleStart();
    if(state.firstTurnBonusEnergy > 0){
        state.energy += state.firstTurnBonusEnergy;
        log(`⏳ 首回合額外 +${state.firstTurnBonusEnergy} 能量`);
    }
    if(state.evolved && state.job === "mage"){
        state.block += 30;
        log("🔮 法師進化：獲得30護盾");
    }
    log(`⚔️ 遭遇 ${state.enemy.name}`);
    startTurn();
}
function draw(n){ for(let i=0;i<n;i++){ if(state.deck.length===0){ if(state.discard.length===0) break; state.deck=shuffle(state.discard); state.discard=[]; log("🔄 洗牌"); } if(state.deck.length) state.hand.push(state.deck.shift()); } if(!state.extraDrawUsed && state.relics.some(r=>r.name==="法師之眼")){ state.extraDrawUsed=true; if(state.deck.length===0){ if(state.discard.length===0) return; state.deck=shuffle(state.discard); state.discard=[]; } if(state.deck.length){ state.hand.push(state.deck.shift()); log("👁️ 法師之眼：額外抽一張牌"); } } }
function startTurn(){ if(!state.enemy) return; if(state.firstTurnOfBattle){ state.firstTurnOfBattle=false; } else { state.energy=state.maxEnergy; } state.block=0; state.tempStrength=0; state.extraDrawUsed=false; if(state.job==="paladin"){ state.block+=20; log("🛡️ 聖騎士被動：獲得20護甲"); } let drawCount = state.job==="mage" ? 6 : 5; if(state.drawReduce) drawCount = Math.max(1, drawCount - state.drawReduce); draw(drawCount); if(state.curseDamage){ state.hp -= state.curseDamage; log(`💔 詛咒造成 ${state.curseDamage} 傷害`); if(state.hp<=0){ die(); return; } } for(let r of state.relics) if(r.turnStart) r.turnStart(); if(state.poison>0){ state.hp-=state.poison; log(`☠️ 中毒造成 ${state.poison}`); state.poison--; if(state.hp<=0){ die(); return; } } render(); }
function dealDamage(dmg) {
    let isCrit = false;
    if (state.job === "assassin" && Math.random() < 0.2) {
        dmg = Math.floor(dmg * state.critBonusMult);
        isCrit = true;
    }
    if (state.enemy.vulnerable > 0) {
        dmg = Math.floor(dmg * 1.5);
        state.enemy.vulnerable--;   // ✅ 每次觸發易傷後消耗 1 層
        log(`💥 易傷觸發！傷害 x1.5，剩餘 ${state.enemy.vulnerable} 層`);
    }
    state.enemy.hp -= dmg;
    log(`⚔️ 造成 ${dmg} 傷害${isCrit ? " 暴擊" : ""}`);
    for (let r of state.relics) if (r.effect) r.effect("attack");
    let enemyDiv = document.getElementById("enemyBox");
    if (enemyDiv) {
        enemyDiv.classList.add("damage");
        setTimeout(() => {
            enemyDiv.classList.remove("damage");
        }, 180);
    }
}function playCard(i){ if(!state.enemy) return; let card=state.hand[i]; if(!card) return; let energyCost=card.cost; if(state.job==="ranger" && card.type==="atk" && !state.rangerFirstAttackFree){ energyCost=0; state.rangerFirstAttackFree=true; log("🏹 遊俠被動：首次攻擊不消耗能量"); } if(state.energy<energyCost){ log("⚡ 能量不足"); return; } if(card.once && state.usedOnceCards.includes(card.name)){ log("❌ 此卡本回合已使用"); return; } state.energy-=energyCost; state.hand.splice(i,1); if(card.once) state.usedOnceCards.push(card.name); switch(card.type){ case "atk": let atkDmg=card.dmg+state.strength+state.tempStrength; dealDamage(atkDmg); if(card.vulnerable) state.enemy.vulnerable+=card.vulnerable; break; case "block": state.block+=card.block; log(`🛡️ 獲得 ${card.block} 護甲`); break; case "poison": let poisonDmg=card.dmg+state.strength+state.tempStrength; dealDamage(poisonDmg); state.enemy.poison+=card.poison; log(`☠️ 敵人中毒 ${card.poison}`); break; case "multi": let multiBase=card.dmg+state.strength+state.tempStrength; for(let x=0;x<card.hits;x++) dealDamage(multiBase); break; case "energy": state.energy+=card.gain; draw(card.draw); log(`⚡ +${card.gain} 能量`); break; case "vul": state.enemy.vulnerable+=card.vulnerable; log(`💥 敵人易傷 ${card.vulnerable}`); break; case "buff": state.strength+=card.strength; log(`💪 力量 +${card.strength}`); break; case "poisonburst": let dmg=(state.enemy.poison||0)*3; state.enemy.hp-=dmg; state.enemy.poison=0; log(`💣 毒爆造成 ${dmg} 傷害，中毒清除`); break; case "percentdmg": let percentDmg=Math.floor(state.enemy.maxHp*card.percent); state.enemy.hp-=percentDmg; log(`🌑 深淵降臨造成 ${percentDmg} 傷害`); break; case "fullheal": state.hp=state.maxHp; log(`❤️ 生命已回滿`); let targetHandSize=10; while(state.hand.length<targetHandSize && (state.deck.length>0||state.discard.length>0)) draw(1); log(`🃏 抽滿手牌`); break; case "lifesteal": dealDamage(card.dmg+state.strength+state.tempStrength); heal(card.heal); log(`🩸 恢復 ${card.heal} HP`); break; case "heal": heal(card.heal); log(`❤️ 恢復 ${card.heal} HP`); break; case "atkblock": let abDmg=card.dmg+state.strength+state.tempStrength; dealDamage(abDmg); state.block+=card.block; log(`🛡️ 獲得 ${card.block} 護甲`); break; case "debuff": if(card.effect) card.effect(); break; } if(state.job==="vampire" && (card.type==="atk"||card.type==="multi") && card.type!=="lifesteal"){ let totalDamage=0; if(card.type==="atk") totalDamage=card.dmg+state.strength+state.tempStrength; if(card.type==="multi") totalDamage=(card.dmg+state.strength+state.tempStrength)*card.hits; let healAmount=Math.floor(totalDamage*(state.vampireHealRatio+(state.vampireHealBonus||0))); heal(healAmount); log(`🩸 吸血鬼被動：吸血 ${healAmount}`); } state.discard.push(card); if(state.enemy && state.enemy.hp<=0){ victory(); return; } render(); }
function endTurn(){ if(!state.enemy) return; while(state.hand.length) state.discard.push(state.hand.pop()); state.tempStrength=0; if(state.job==="ranger") state.rangerFirstAttackFree=false; enemyTurn(); }
// 輔助函式：取得範圍內的隨機整數 [min, max]
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ----------------------------------------------------
// 1. 連續閃躲 QTE 主邏輯 (4~7次 / 7~9次 / 10~15次)
// ----------------------------------------------------
function triggerComboDodgeQTE(enemy, baseDamage, onComplete) {
    // 根據敵人階級決定連擊次數
    let hitCount = 0;
    if (enemy.rank === "boss") {
        hitCount = getRandomInt(10, 15);
    } else if (enemy.rank === "elite") {
        hitCount = getRandomInt(7, 9);
    } else {
        hitCount = getRandomInt(4, 7); // 一般小怪
    }

    log(`⚠️ ${enemy.name || "敵人"} 發動了 ${hitCount} 連擊！準備閃躲！`);

    let successCount = 0;
    let currentHit = 0;

    // 進行單次閃躲
    function nextHit() {
        if (currentHit >= hitCount) {
            finishDodge();
            return;
        }

        currentHit++;

        // 呼叫你的 QTE 介面顯示 (傳入當前第幾擊、總擊數)
        showDodgeButton(currentHit, hitCount, (isSuccess) => {
            if (isSuccess) {
                successCount++;
                log(`💨 第 ${currentHit}/${hitCount} 擊：閃過！`);
            } else {
                log(`💥 第 ${currentHit}/${hitCount} 擊：沒閃過！`);
            }

            // 連擊間隔時間 (例如 670ms)
            setTimeout(nextHit, 670);
        });
    }

    // 閃躲結束結算傷害
    function finishDodge() {
        let failCount = hitCount - successCount;
        let finalDamage = Math.floor((baseDamage / hitCount) * failCount);

        let resultMsg = "";
        if (failCount === 0) {
            resultMsg = `✨ 完美閃避！成功連續閃過 ${hitCount} 次攻擊，完全無傷！`;
        } else {
            resultMsg = `💨 閃過 ${successCount}/${hitCount} 次，受到 ${finalDamage} 傷害`;
        }

        onComplete(finalDamage, resultMsg);
    }

    nextHit();
}

// ----------------------------------------------------
// 2. 敵人回合主要邏輯 (整合 0.5 機率閃躲與格擋)
// ----------------------------------------------------
function enemyTurn() {
    if (!state.enemy) return;

    // 中毒結算
    if (state.enemy.poison > 0) {
        state.enemy.hp -= state.enemy.poison;
        log(`☠️ 敵人中毒 ${state.enemy.poison}`);
        state.enemy.poison--;
        if (state.enemy.hp <= 0) { victory(); return; }
    }

    // Boss 狂暴 logic
    if (state.enemy.rank === "boss" && state.enemy.hp < state.enemy.maxHp * 0.5 && !state.enemy.rage) {
        state.enemy.rage = true;
        state.enemy.atk += 8;
        log("🔥 Boss 狂暴化！");
    }

    // 算基本傷害
    let dmg = state.enemy.atk;
    if (state.enemy.nextTurnAtkMod) {
        dmg = Math.floor(dmg * state.enemy.nextTurnAtkMod);
        delete state.enemy.nextTurnAtkMod;
        log("🌀 陷阱效果：敵人攻擊力減半");
    }

    if (state.enemy.vulnerable > 0) state.enemy.vulnerable--;

    // 🛡️ 護甲優先扣除
    dmg = Math.max(0, dmg - state.block);

    // 🎲 判定是否觸發閃躲（50% 機率）
    let canDodge = Math.random() < 0.5;

    if (canDodge) {
        // 50% 進入連擊閃躲 QTE
        triggerComboDodgeQTE(state.enemy, dmg, (finalDamage, message) => {
            applyDamageAndNextTurn(finalDamage, message);
        });
    } else {
        // 50% 走原本的格擋 QTE
        triggerParryQTE(dmg, (finalDamage, message) => {
            applyDamageAndNextTurn(finalDamage, message);
        });
    }
}

// ----------------------------------------------------
// 3. 扣血與回合推進 (收尾輔助函式)
// ----------------------------------------------------
function applyDamageAndNextTurn(finalDamage, message) {
    state.hp -= finalDamage;
    log(`👾 ${message}`);

    for (let r of state.relics) if (r.effect) r.effect("hit", finalDamage);

    if (state.hp <= 0) {
        die();
        return;
    }

    startTurn();
}
function victory() {
    if (typeof AudioManager !== 'undefined') AudioManager.playBGM('victory');

    state.inBattle = false; // ✅ 先設定非戰鬥狀態
    
    let rewardGold = 25 + state.floor * 5;
    if (state.enemy.rank === "elite") rewardGold *= 2;
    if (state.enemy.rank === "boss") rewardGold *= 4;
    state.gold += rewardGold;
    
    log(`<b style="color:#facc15; font-size:1.1rem;">✨ ⚔️ 【 戰 鬥 勝 利 】 ⚔️ ✨</b>`);
    log(`🏆 順利擊敗強敵，獲得 ${rewardGold} 魂石！`);
    
    if (state.enemy.rank === "boss" && state.floor >= 30) {
        state.evolutionPoints++;
        log(`🌟 獲得進化點數！可用於職業進化（目前 ${state.evolutionPoints} 點）`);
    }
    
    state.enemy = null;
    state.floor++;
    generateMap(); // ✅ 生成新地圖
    render(); // ✅ 先渲染一次，顯示地圖
    
    // ✅ 顯示 VICTORY 特效
    const victoryEffect = document.createElement("div");
    victoryEffect.innerText = "VICTORY";
    victoryEffect.style.position = "fixed";
    victoryEffect.style.top = "45%";
    victoryEffect.style.left = "50%";
    victoryEffect.style.transform = "translate(-50%, -50%) scale(0.3)";
    victoryEffect.style.color = "#facc15";
    victoryEffect.style.fontSize = "5.5rem";
    victoryEffect.style.fontWeight = "900";
    victoryEffect.style.letterSpacing = "10px";
    victoryEffect.style.textShadow = "0 0 25px rgba(250, 204, 21, 0.7), 0 0 50px rgba(0, 0, 0, 0.9)";
    victoryEffect.style.zIndex = "99999";
    victoryEffect.style.opacity = "0";
    victoryEffect.style.pointerEvents = "none";
    victoryEffect.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    document.body.appendChild(victoryEffect);
    
    setTimeout(() => {
        victoryEffect.style.opacity = "1";
        victoryEffect.style.transform = "translate(-50%, -50%) scale(1)";
    }, 30);
    
    setTimeout(() => {
        victoryEffect.style.opacity = "0";
        victoryEffect.style.transform = "translate(-50%, -50%) scale(1.2)";
        setTimeout(() => { victoryEffect.remove(); }, 400);
        // ✅ 顯示選卡獎勵（此時地圖已經 ready）
        showCardReward();
    }, 1500);
}
function showCardReward() {
    let modal = document.getElementById("rewardModal");
    let area = document.getElementById("rewardCards");
    area.innerHTML = "";
    let rewards = [];
    let pool = getNormalCards();
    for (let i = 0; i < 3; i++) rewards.push(copyCard(pool[Math.floor(Math.random() * pool.length)]));
    
    rewards.forEach(card => {
        let div = document.createElement("div");
        div.className = `card ${card.rarity}`;
        div.setAttribute("title", getCardTooltip(card));
        div.innerHTML = cardHtml(card);
        div.onclick = () => {
            // ✅ 1. 將卡片加入牌組
            state.deck.push(copyCard(card));
            if (!state.ownedCardNames.includes(card.name)) {
                state.ownedCardNames.push(card.name);
            }
            log(`🎴 獲得卡牌：${card.name}`);
            
            // ✅ 2. 關閉獎勵視窗
            modal.style.display = "none";
            
            // ✅ 3. 切換回主選單音樂
            if (typeof AudioManager !== 'undefined') AudioManager.playBGM('menu');
            
            // ✅ 4. 確保遊戲狀態正確（非戰鬥、地圖已生成）
            state.inBattle = false;
            
            // ✅ 5. 重新渲染（但不要重新生成地圖，避免覆蓋進度）
            render();
            
            // ✅ 6. 額外確保地圖節點可點擊（強制刷新地圖顯示）
            // 因為 render() 已經會處理，但為保險起見，再觸發一次
            // 不需要再呼叫 generateMap()，否則會重置地圖
        };
        area.appendChild(div);
    });
    
    modal.style.display = "flex";
}
function cardHtml(card){ return `<div class="energy">${card.cost}</div><div><div style="font-size:18px;font-weight:bold">${card.name}</div><div class="small">${rarityText(card.rarity)}</div></div><div><div style="margin-top:10px">${card.desc}</div></div>`; }
function rarityText(r){ if(r==="common") return "普通"; if(r==="rare") return "稀有"; if(r==="epic") return "史詩"; if(r==="legend") return "傳說"; return ""; }
function getCardTooltip(card){ let lines=[`${card.name} (${rarityText(card.rarity)})`,`費用: ${card.cost}`]; if(card.dmg) lines.push(`傷害: ${card.dmg}`); if(card.block) lines.push(`護甲: ${card.block}`); if(card.heal) lines.push(`治療: ${card.heal}`); if(card.hits) lines.push(`攻擊次數: ${card.hits}`); if(card.poison) lines.push(`中毒: ${card.poison}`); if(card.strength) lines.push(`力量: ${card.strength}`); if(card.gain) lines.push(`獲得能量: ${card.gain}`); if(card.draw) lines.push(`抽牌: ${card.draw}`); lines.push(card.desc); return lines.join("\n"); }
function die(){
    log("💀 你死亡了");
    state.floor=1;
    state.gold=60;
    state.gameStarted=false;
    setJob(state.job);
    state.blackMarketCards=null;
    state.shopCards=null;

    // 🎵 【音效觸發】死亡結算回起點時，也切換回主選單音樂
    if (typeof AudioManager !== 'undefined') AudioManager.playBGM('menu');
}
// ================= 商店機制 =================
function generateShopCards(){
    let allAvailable = [...getNormalCards(), ...getUnlockedCardObjects()];
    if(allAvailable.length === 0) return [];
    let shuffled = shuffle([...allAvailable]);
    let selected = [];
    for(let i=0; i<shuffled.length && selected.length<3; i++){
        let card = shuffled[i];
        if(!selected.some(c=>c.name===card.name)) selected.push(copyCard(card));
    }
    return selected;
}
function openShop(){
    if(!state.shopCards) state.shopCards = generateShopCards();
    let modal = document.getElementById("shopModal");
    modal.style.display = "flex";
    renderShopUI();
}
function renderShopUI(){
    document.getElementById("shopGold").innerText = state.gold;
    let area = document.getElementById("shopCards");
    area.innerHTML = "";
    if(!state.shopCards || state.shopCards.length===0){
        area.innerHTML = "<div class='small'>暫無可購買卡牌</div>";
        return;
    }
    state.shopCards.forEach((card, idx)=>{
        let div = document.createElement("div");
        div.className = `card ${card.rarity}`;
        div.setAttribute("title", getCardTooltip(card));
        let basePrice;
        if(
    state.ownedCardNames.includes(card.name) ||
    state.unlockedCardNames.includes(card.name)
){
            let originalCard = drawOnlyCardPool.find(c=>c.name===card.name);
            basePrice = originalCard ? originalCard.price : 60;
        } else {
            basePrice = 30 + card.cost * 10;
        }
        let finalPrice = Math.floor(basePrice * (state.shopDiscount||1));
        if(finalPrice < 1) finalPrice = 1;
        div.innerHTML = cardHtml(card) + `<div style="margin-top:10px"><button class="btn">購買 ${finalPrice} 石</button></div>`;
        div.onclick = (e)=>{
            e.stopPropagation();
            if(state.gold < finalPrice){ log("💰 魂石不足"); return; }
            state.gold -= finalPrice;
            if(state.unlockedCardNames.includes(card.name)){
                log(`✨ 購買解鎖卡：${card.name}，已加入牌組（可再次購買）`);
            } else {
                log(`🛒 購買一般卡：${card.name}`);
            }
            state.deck.push(card);
            state.shopCards = generateShopCards();
            renderShopUI();
            render();
        };
        area.appendChild(div);
    });
}
function refreshShop(){
    if(state.gold < 50){ log("💰 魂石不足 50，無法刷新商店"); return; }
    state.gold -= 50;
    state.shopCards = generateShopCards();
    renderShopUI();
    render();
    log("🔄 商店已刷新");
}
function closeShop(){ document.getElementById("shopModal").style.display = "none"; }
function healShop(){
    if(state.gold < 25){ log("💰 魂石不足"); return; }
    state.gold -= 25;
    heal(30);
    log("❤️ 回復30HP");
    renderShopUI();
    render();
}
function removeCardShop(){
    if(state.gold < 35){ log("💰 魂石不足"); return; }
    if(state.deck.length <= 5){ log("❌ 牌太少"); return; }
    state.gold -= 35;
    openDeckRemove();
}
function openDeckRemove(){
    let modal=document.getElementById("deckModal");
    modal.style.display="flex";
    let area=document.getElementById("deckView");
    area.innerHTML="";
    state.deck.forEach((card,idx)=>{
        let div=document.createElement("div");
        div.className=`card ${card.rarity}`;
        div.setAttribute("title",getCardTooltip(card));
        div.innerHTML=cardHtml(card);
        div.onclick=()=>{
            log(`🗑️ 移除 ${card.name}`);
            state.deck.splice(idx,1);
            closeDeckView();
            renderShopUI();
            render();
        };
        area.appendChild(div);
    });
}
function openDeckView(){
    let modal=document.getElementById("deckModal");
    modal.style.display="flex";
    let area=document.getElementById("deckView");
    area.innerHTML="";
    state.deck.forEach(card=>{
        let div=document.createElement("div");
        div.className=`card ${card.rarity}`;
        div.setAttribute("title",getCardTooltip(card));
        div.innerHTML=cardHtml(card);
        area.appendChild(div);
    });
}
function closeDeckView(){ document.getElementById("deckModal").style.display="none"; }
// ================= 奸商（購買後刷新） =================
function generateBlackMarketCards(){
    let allAvailable = [...getNormalCards(), ...getUnlockedCardObjects()];
    if(allAvailable.length === 0) return [];
    let shuffled = shuffle([...allAvailable]);
    let selected = [];
    for(let i=0; i<shuffled.length && selected.length<3; i++){
        let card = shuffled[i];
        if(!selected.some(c=>c.name===card.name)) selected.push(copyCard(card));
    }
    return selected;
}
function renderBlackMarketUI(){
    let modal = document.getElementById("blackMarketModal");
    if(modal.style.display !== "flex") return;
    document.getElementById("blackGold").innerText = state.gold;
    let area = document.getElementById("blackCards");
    area.innerHTML = "";
    if(!state.blackMarketCards || state.blackMarketCards.length===0){
        area.innerHTML = "<div class='small'>暫無可購買卡牌</div>";
        return;
    }
    state.blackMarketCards.forEach((card, idx)=>{
        let div = document.createElement("div");
        div.className = `card ${card.rarity}`;
        div.setAttribute("title", getCardTooltip(card));
        let basePrice;
        if(state.unlockedCardNames.includes(card.name)){
            let originalCard = drawOnlyCardPool.find(c=>c.name===card.name);
            basePrice = originalCard ? originalCard.price : 60;
        } else {
            basePrice = 30 + card.cost * 10;
        }
        let finalPrice = Math.floor(basePrice * 3 * (state.shopDiscount||1));
        if(finalPrice < 1) finalPrice = 1;
        div.innerHTML = cardHtml(card) + `<div style="margin-top:10px"><button class="btn">奸商價 ${finalPrice} 石（原價 ${Math.floor(basePrice)}）</button></div>`;
        div.onclick = (e)=>{
            e.stopPropagation();
            if(state.gold < finalPrice){ log("💰 魂石不足"); return; }
            state.gold -= finalPrice;
            if(state.unlockedCardNames.includes(card.name)){
                log(`💰 奸商：購買解鎖卡 ${card.name}，已加入牌組（可再次購買）`);
            } else {
                log(`💰 奸商：購買一般卡 ${card.name}，三倍價格`);
            }
            state.deck.push(card);
            state.blackMarketCards = generateBlackMarketCards();
            renderBlackMarketUI();
            render();
        };
        area.appendChild(div);
    });
}
function openBlackMarket(){
    if(!state.blackMarketCards) state.blackMarketCards = generateBlackMarketCards();
    let modal = document.getElementById("blackMarketModal");
    modal.style.display = "flex";
    renderBlackMarketUI();
}
function closeBlackMarket(){ document.getElementById("blackMarketModal").style.display = "none"; }
// 抽卡系统
function isCardUnlocked(cardName){

    return state.unlockedCardNames.includes(cardName)
        || state.ownedCardNames.includes(cardName);

}
function getUndrawnCards(){

    return drawOnlyCardPool.filter(card=>

        !state.unlockedCardNames.includes(card.name)
        && !state.ownedCardNames.includes(card.name)

    );

}function drawRandomNewCard(){ let available=getUndrawnCards(); if(available.length===0) return null; let idx=Math.floor(Math.random()*available.length); return copyCard(available[idx]); }
function drawSingle(){ if(state.inBattle){ log("戰鬥中無法抽卡"); return; } if(state.gold<100){ log("魂石不足（需要 100）"); return; } let newCard=drawRandomNewCard(); if(!newCard){ log("✨ 你已經解鎖了所有抽卡池的卡牌！無需再抽"); return; } state.gold-=100; if(!state.unlockedCardNames.includes(newCard.name)) state.unlockedCardNames.push(newCard.name); log(`✨ 抽卡獲得全新卡牌：${newCard.name}（${rarityText(newCard.rarity)}），已解鎖購買資格，將出現在商店中，價格 ${newCard.price} 石（可重複購買）`); let resultArea=document.getElementById("drawResultArea"); resultArea.innerHTML=""; let cardDiv=document.createElement("div"); cardDiv.className=`result-card ${newCard.rarity}`; cardDiv.setAttribute("title",getCardTooltip(newCard)); cardDiv.innerHTML=`<div class="energy">${newCard.cost}</div><div style="font-weight:bold; margin-top:8px;">${newCard.name}</div><div class="small">${rarityText(newCard.rarity)}</div><div class="small" style="margin-top:6px;">${newCard.desc}</div><div class="small" style="margin-top:8px;">🛒 商店價格: ${newCard.price}</div>`; resultArea.appendChild(cardDiv); cardDiv.style.animation="cardPop 0.3s cubic-bezier(0.2,0.9,0.4,1.1) forwards"; document.getElementById("drawGold").innerText=state.gold; render(); }
function drawTen(){ if(state.inBattle){ log("戰鬥中無法抽卡"); return; } if(state.gold<980){ log("魂石不足（需要 980）"); return; } let newCards=[]; for(let i=0;i<10;i++){ let card=drawRandomNewCard(); if(!card) break; newCards.push(card); if(!state.unlockedCardNames.includes(card.name)) state.unlockedCardNames.push(card.name); } if(newCards.length===0){ log("✨ 你已經解鎖了所有抽卡池的卡牌！無需再抽"); return; } state.gold-=980; log(`🌟 十連抽！獲得 ${newCards.length} 張全新卡牌：${newCards.map(c=>c.name).join(", ")}，已解鎖購買資格，將出現在商店中（可重複購買）`); let resultArea=document.getElementById("drawResultArea"); resultArea.innerHTML=""; newCards.forEach((card,idx)=>{ let cardDiv=document.createElement("div"); cardDiv.className=`result-card ${card.rarity}`; cardDiv.setAttribute("title",getCardTooltip(card)); cardDiv.innerHTML=`<div class="energy">${card.cost}</div><div style="font-weight:bold; margin-top:8px;">${card.name}</div><div class="small">${rarityText(card.rarity)}</div><div class="small" style="margin-top:6px;">${card.desc}</div><div class="small" style="margin-top:8px;">🛒 商店價格: ${card.price}</div>`; cardDiv.style.animation=`cardPop 0.25s ease-out ${idx*0.05}s forwards`; cardDiv.style.opacity="0"; resultArea.appendChild(cardDiv); }); document.getElementById("drawGold").innerText=state.gold; render(); }
function openDrawModal(){ if(state.inBattle){ log("戰鬥中無法抽卡"); return; } document.getElementById("drawGold").innerText=state.gold; document.getElementById("drawResultArea").innerHTML=""; document.getElementById("drawModal").style.display="flex"; }
function closeDrawModal(){ document.getElementById("drawModal").style.display="none"; }
function openCollectionModal(){ let container=document.getElementById("collectionGrid"); container.innerHTML=""; for(let card of drawOnlyCardPool){ let isUnlocked =
    state.unlockedCardNames.includes(card.name) ||
    state.ownedCardNames.includes(card.name);let div=document.createElement("div"); div.className=`collection-card ${isUnlocked?"":"locked"} ${card.rarity}`; div.innerHTML=`<div class="energy">${card.cost}</div><div class="collection-name">${card.name}</div><div class="collection-rarity">${rarityText(card.rarity)}</div><div class="collection-desc">${isUnlocked?card.desc:"尚未解鎖，請抽卡"}</div>`; container.appendChild(div); } document.getElementById("collectionModal").style.display="flex"; }
function closeCollectionModal(){ document.getElementById("collectionModal").style.display="none"; }
// 转盘（战斗中禁用）
let wheelCanvas, wheelCtx, wheelSegments=[], isSpinning=false, spinAnimationId, spinStartTime, spinDuration=2000, spinStartAngle, spinTargetAngle, spinCurrentAngle;
function drawWheel(angleRad){ if(!wheelCtx) return; const w=wheelCanvas.width, h=wheelCanvas.height, cx=w/2, cy=h/2, radius=w/2-12; wheelCtx.clearRect(0,0,w,h); const segCount=wheelSegments.length; if(segCount===0) return; const angleStep=Math.PI*2/segCount; for(let i=0;i<segCount;i++){ const start=i*angleStep+angleRad, end=(i+1)*angleStep+angleRad; wheelCtx.beginPath(); wheelCtx.moveTo(cx,cy); wheelCtx.arc(cx,cy,radius,start,end); wheelCtx.closePath(); wheelCtx.fillStyle=i%2===0?'#2a3a2a':'#1a2a1a'; wheelCtx.fill(); wheelCtx.save(); wheelCtx.translate(cx,cy); wheelCtx.rotate(start+angleStep/2); wheelCtx.textAlign="center"; wheelCtx.textBaseline="middle"; wheelCtx.font="bold 18px 'Segoe UI','Noto Sans TC'"; wheelCtx.fillStyle="#ffffff"; let name=wheelSegments[i].name; if(name.length>6) name=name.slice(0,5)+"…"; wheelCtx.fillText(name,radius*0.68,0); wheelCtx.restore(); wheelCtx.beginPath(); wheelCtx.moveTo(cx,cy); wheelCtx.arc(cx,cy,radius,start,end); wheelCtx.lineTo(cx,cy); wheelCtx.strokeStyle="#2dff7a"; wheelCtx.lineWidth=2; wheelCtx.stroke(); } wheelCtx.beginPath(); wheelCtx.arc(cx,cy,24,0,Math.PI*2); wheelCtx.fillStyle="#1a2a1a"; wheelCtx.fill(); wheelCtx.strokeStyle="#2dff7a"; wheelCtx.lineWidth=3; wheelCtx.stroke(); }
function initWheelSegments(){ let pool=[...getNormalCards(),...getUnlockedCardObjects()]; if(pool.length===0) return []; let segments=[]; let shuffled=shuffle([...pool]); for(let i=0;i<8 && i<shuffled.length;i++) segments.push(shuffled[i]); while(segments.length<8) segments.push(segments[0]); return shuffle(segments); }
function openWheelModal(){ if(state.inBattle){ log("⚔️ 戰鬥中無法使用轉盤！"); return; } if(state.gold<60){ log("💰 魂石不足 60"); return; } wheelSegments=initWheelSegments(); spinCurrentAngle=0; if(wheelCanvas) drawWheel(0); document.getElementById("wheelResultText").innerHTML=""; document.getElementById("wheelModal").style.display="flex"; const spinBtn=document.getElementById("wheelSpinBtn"); if(spinBtn) spinBtn.disabled=false; }
function closeWheelModal(){ document.getElementById("wheelModal").style.display="none"; if(isSpinning){ cancelAnimationFrame(spinAnimationId); isSpinning=false; } }
function startWheel(){ if(isSpinning) return; if(state.gold<60){ log("💰 魂石不足 60"); closeWheelModal(); return; } state.gold-=60; render(); wheelSegments=initWheelSegments(); spinCurrentAngle=0; drawWheel(0); const rounds=5+Math.random()*5, targetAngleDelta=Math.PI*2*rounds, extraRandom=Math.random()*Math.PI*2; const targetAngle=spinCurrentAngle+targetAngleDelta+extraRandom; spinStartAngle=spinCurrentAngle; spinTargetAngle=targetAngle; spinStartTime=performance.now(); isSpinning=true; const spinBtn=document.getElementById("wheelSpinBtn"); if(spinBtn) spinBtn.disabled=true; function animateSpin(now){ let t=Math.min(1,(now-spinStartTime)/spinDuration); const ease=1-Math.pow(1-t,3); const newAngle=spinStartAngle+(spinTargetAngle-spinStartAngle)*ease; spinCurrentAngle=newAngle; drawWheel(newAngle); if(t<1){ spinAnimationId=requestAnimationFrame(animateSpin); } else{ const finalAngle=spinCurrentAngle%(Math.PI*2); let pointerAngle=(Math.PI*3/2)%(Math.PI*2); let diff=pointerAngle-finalAngle; if(diff<0) diff+=Math.PI*2; const segCount=wheelSegments.length, angleStep=Math.PI*2/segCount; let segIndex=Math.floor(diff/angleStep)%segCount; const wonCard=wheelSegments[segIndex]; state.deck.push(copyCard(wonCard)); log(`🎡 轉盤獲得：${wonCard.name}（${rarityText(wonCard.rarity)}），已加入牌組`); document.getElementById("wheelResultText").innerHTML=`獲得：${wonCard.name}`; isSpinning=false; if(spinBtn) spinBtn.disabled=false; render(); } } spinAnimationId=requestAnimationFrame(animateSpin); }
function evolveJob(){ if(state.evolved){ log("已經進化過了！"); return; } if(state.evolutionPoints<=0){ log("沒有進化點數，擊敗30層後的Boss可獲得"); return; } state.evolved=true; state.evolutionPoints--; if(state.job==="assassin"){ state.permanentStrength=20; state.strength+=20; log("🗡️ 刺客進化：永久力量 +20"); } let {baseHp,baseEnergy}=applyEvolution(); state.maxHp=Math.max(state.maxHp,baseHp); state.maxEnergy=Math.max(state.maxEnergy,baseEnergy); state.hp=state.maxHp; state.energy=state.maxEnergy; log(`🌟 職業進化！獲得強化效果！`); render(); }
function unlockHiddenJob(jobType){ if(state.floor<50){ log("❌ 需要達到50層才能解鎖隱藏職業"); return; } if(state.evolutionPoints<5){ log("❌ 需要5個進化點數"); return; } state.evolutionPoints-=5; setJob(jobType,true); state.evolved=true; let {baseHp,baseEnergy}=applyEvolution(); state.maxHp=Math.max(state.maxHp,baseHp); state.maxEnergy=Math.max(state.maxEnergy,baseEnergy); state.hp=state.maxHp; state.energy=state.maxEnergy; log(`🌟 解鎖隱藏職業：${jobType}`); render(); }
function gainRelic(){
    let available=relicPool.filter(r=>!state.relics.some(ex=>ex.name===r.name));
    if(available.length===0) return;
    let totalWeight=available.reduce((sum,r)=>sum+(r.weight||1),0);
    let rand=Math.random()*totalWeight, accum=0, selected=null;
    for(let r of available){ accum+=(r.weight||1); if(rand<=accum){ selected=r; break; } }
    if(!selected) selected=available[0];
    let newRelic=selected; state.relics.push(newRelic);
    if(newRelic.onGet) newRelic.onGet();
    log(`🧿 獲得遺物：${newRelic.name}（${newRelic.rarity}）`); render();
}
function enterNode(i){ let node=state.map[i]; if(node.done) return; node.done=true; if(!state.gameStarted){ state.gameStarted=true; render(); } switch(node.type){ case "戰鬥": spawnEnemy("normal"); break; case "精英": spawnEnemy("elite"); break; case "Boss": spawnEnemy("boss"); break; case "休息": heal(Math.floor(state.maxHp*.4)); log("🔥 休息恢復生命"); break; case "寶箱": let goldGain=40+Math.floor(Math.random()*50); state.gold+=goldGain; log(`💰 寶箱獲得 ${goldGain} 魂石`); if(Math.random()<0.25) gainRelic(); break; case "商店": openShop(); break; case "事件": let evt = Math.random(); if(evt<0.33){ let ch=prompt("祝福祭壇：1.+10最大生命 2.+10力量 3.+500石","1"); if(ch==="1"){ state.maxHp+=10; state.hp+=10; log("❤️ 最大生命+10"); } else if(ch==="2"){ state.strength+=10; log("💪 力量+10"); } else if(ch==="3"){ state.gold+=500; log("💰 獲得500石"); } } else if(evt<0.66){ let rc=copyCard(getNormalCards()[Math.floor(Math.random()*getNormalCards().length)]); let cc=copyCard(curseCardPool[Math.floor(Math.random()*curseCardPool.length)]); state.deck.push(rc); state.deck.push(cc); log(`🎁 詛咒寶箱：獲得${rc.name}，詛咒卡${cc.name}`); if(cc.effect) cc.effect(); } else { if(state.gold>=200){ state.gold-=200; if(Math.random()<0.5){ state.gold+=400; log("🎲 賭博勝利！+400石"); } else log("😭 賭博失敗 -200石"); } else log("魂石不足200，無法賭博"); } break; } render(); }
function saveGame(){ localStorage.setItem("abyss_rune_final",JSON.stringify(state)); log("💾 已存檔"); }
function loadGame(){ let raw=localStorage.getItem("abyss_rune_final"); if(!raw){ log("❌ 沒有存檔"); return; } state=JSON.parse(raw); if(state.equipmentUnlocked===undefined) state.equipmentUnlocked=false; if(state.equipment===undefined) state.equipment={ weapon: null, armor: null, pants: null, boots: null }; if(state.blackMarketCards===undefined) state.blackMarketCards=null; if(state.shopCards===undefined) state.shopCards=null; render(); log("📀 讀取完成"); }
function render(){
    document.getElementById("hp").innerText=state.hp; document.getElementById("maxHp").innerText=state.maxHp;
    document.getElementById("energy").innerText=state.energy; document.getElementById("maxEnergy").innerText=state.maxEnergy;
    document.getElementById("block").innerText=state.block; document.getElementById("gold").innerText=state.gold;
    document.getElementById("floor").innerText=state.floor; document.getElementById("poison").innerText=state.poison;
    document.getElementById("strength").innerText=state.strength; document.getElementById("evoPoints").innerText=state.evolutionPoints;
    document.getElementById("deckCount").innerText=state.deck.length; document.getElementById("discardCount").innerText=state.discard.length;
    let jobDesc=""; if(state.job==="warrior") jobDesc="戰士：+20最大生命"; else if(state.job==="mage") jobDesc="法師：+1能量，每回合抽6張"; else if(state.job==="assassin") jobDesc="刺客：20%暴擊"; else if(state.job==="paladin") jobDesc="聖騎士：每回合+20護甲"; else if(state.job==="ranger") jobDesc="遊俠：首次攻擊不耗能"; else if(state.job==="vampire") jobDesc="吸血鬼：攻擊吸血40%"; if(state.evolved) jobDesc+=" (🌟已進化)"; document.getElementById("jobInfo").innerHTML=jobDesc; document.getElementById("evolvedInfo").innerHTML=state.evolved?"已獲得進化之力":"";
    document.getElementById("playerHpFill").style.width=(state.hp/state.maxHp*100)+"%";
    let handHtml=""; state.hand.forEach((card,i)=>{ handHtml+=`<div class="card ${card.rarity}" title="${getCardTooltip(card).replace(/"/g,'&quot;')}" onclick="playCard(${i})">${cardHtml(card)}</div>`; }); document.getElementById("hand").innerHTML=handHtml||"沒有手牌";
    let mapHtml=""; 
const mapIcons = {
    '戰鬥': '⚔️',
    '精英': '👾',
    'Boss': '🐉',
    '商店': '🏪',
    '休息': '🔥',
    '寶箱': '📦',
    '事件': '❓'
};
state.map.forEach((n,i)=>{ 
    const icon = mapIcons[n.type] || '📍';
    mapHtml+=`<div class="node ${n.done?'done':''}" onclick="enterNode(${i})">${icon} ${n.type}</div>`; 
});
document.getElementById("map").innerHTML=mapHtml; document.getElementById("map").innerHTML=mapHtml;
    if(state.enemy){ document.getElementById("enemyArea").innerHTML=`<div class="enemy" id="enemyBox"><h2 class="${state.enemy.rank==='boss'?'boss':''}">${state.enemy.name}</h2><div>❤️ ${state.enemy.hp}/${state.enemy.maxHp}</div><div class="hpbar"><div class="hpfill" style="width:${state.enemy.hp/state.enemy.maxHp*100}%"></div></div><div style="margin-top:8px">⚔️ 攻擊：${state.enemy.atk}</div><div class="poison">☠️ 中毒：${state.enemy.poison}</div><div class="vul">💥 易傷：${state.enemy.vulnerable}</div></div>`; } else { document.getElementById("enemyArea").innerHTML="<div class='small'>目前沒有敵人</div>"; }
    let relicHtml=""; state.relics.forEach(r=>{ relicHtml+=`<div class="relic"><div><b>${r.name}</b></div><div class="small">${r.desc}</div></div>`; }); document.getElementById("relics").innerHTML=relicHtml||"無";
    let started=state.gameStarted; document.getElementById("jobWarrior").disabled=started; document.getElementById("jobMage").disabled=started; document.getElementById("jobAssassin").disabled=started;
    let hiddenBtnDiv=document.getElementById("hiddenJobBtn"); if(state.floor>=50 && state.evolutionPoints>=5 && !(state.job==="paladin"||state.job==="ranger"||state.job==="vampire")){ hiddenBtnDiv.innerHTML=`<button class="btn evolution-btn" onclick="unlockHiddenJob('paladin')">⚔️ 解鎖聖騎士 (5點)</button><button class="btn evolution-btn" onclick="unlockHiddenJob('ranger')">🏹 解鎖遊俠 (5點)</button><button class="btn evolution-btn" onclick="unlockHiddenJob('vampire')">🦇 解鎖吸血鬼 (5點)</button>`; } else { hiddenBtnDiv.innerHTML=""; }
    let unlockBtn = document.getElementById("unlockEquipmentBtn"); if(state.floor >= 100 && !state.equipmentUnlocked){ unlockBtn.style.display = "inline-block"; } else { unlockBtn.style.display = "none"; }
    let equipStatusDiv = document.getElementById("equipStatus"); if(state.equipmentUnlocked){ let weaponR = state.equipment.weapon ? RARITY_NAME[state.equipment.weapon.rarity] : "無"; let armorR = state.equipment.armor ? RARITY_NAME[state.equipment.armor.rarity] : "無"; let pantsR = state.equipment.pants ? RARITY_NAME[state.equipment.pants.rarity] : "無"; let bootsR = state.equipment.boots ? RARITY_NAME[state.equipment.boots.rarity] : "無"; equipStatusDiv.innerHTML = `✨ 裝備稀有度：武器 ${weaponR} / 衣服 ${armorR} / 褲子 ${pantsR} / 鞋子 ${bootsR}`; } else { equipStatusDiv.innerHTML = "🔒 裝備未解鎖 (100層+5000石) · 解鎖後可購買並用魂石提升稀有度"; } }
window.addEventListener("load",()=>{ wheelCanvas=document.getElementById("wheelCanvas"); if(wheelCanvas) wheelCtx=wheelCanvas.getContext("2d"); const spinBtn=document.getElementById("wheelSpinBtn"); if(spinBtn) spinBtn.onclick=startWheel; setJob("warrior"); render(); log("🌌 深淵符文啟動"); });
// ==========================================
// 🚀 極簡開場畫面控制器
// ==========================================

/**
 * 點擊唯一的「開始遊戲」按鈕
 */
function handleStartGame() {
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
        startScreen.classList.add("hidden");
    }
    
    loadGame();
    
    if (typeof AudioManager !== 'undefined' && !AudioManager.bgm) {
        AudioManager.playBGM('menu');
    }
    
    log("🌌 虛空之門已開啟，冒險正式開始！");
}

// ==========================================
// 核心載入監聽器 (完全保留你原本的所有初始化邏輯)
// ==========================================
window.addEventListener("load", () => { 
    // 初始化轉盤...
    wheelCanvas = document.getElementById("wheelCanvas"); 
    if (wheelCanvas) wheelCtx = wheelCanvas.getContext("2d"); 
    const spinBtn = document.getElementById("wheelSpinBtn"); 
    if (spinBtn) spinBtn.onclick = startWheel; 
    
    // 預設職業
    setJob("warrior"); 
    render(); 
    
    // 檢查是否從股市返回（需要自動讀檔 + 跳過開始畫面）
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoload') === 'true') {
        // 
        loadGame();
        // 
        const startScreen = document.getElementById("start-screen");
        if (startScreen) {
            startScreen.classList.add("hidden");
        }
        // 
        if (typeof AudioManager !== 'undefined' && !AudioManager.bgm) {
            AudioManager.playBGM('menu');
        }
        // 
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    console.log("遊戲核心載入完畢");
});


// =======================================================
// =======================================================
// 🌐 P2P 即時連線對戰系統 (卡牌對戰版)
// =======================================================
let p2pPeer = null;
let p2pConn = null;
let p2pState = {
    myHp: 500,
    enemyHp: 500,
    myBlock: 0,
    enemyBlock: 0,
    myPoison: 0,
    enemyPoison: 0,
    isMyTurn: false,
    role: '',           // 'host' 或 'guest'
    myJob: '冒險者',
    enemyJob: '未填寫',
    hand: [],           // 當前回合抽到的 5 張卡 (僅在己方回合有值)
    selectedIndices: [], // 已選中的卡片索引 (最多3)
    phase: 'idle'       // 'idle' | 'selecting' | 'waiting' | 'gameover'
};

// 完整 PvP 卡池 (合併所有卡)
const pvpCardPool = (() => {
    const all = [
        ...baseCardPool,
        ...existingExtraCardPool,
        ...drawOnlyCardPool,
        ...hiddenCardPool.paladin,
        ...hiddenCardPool.ranger,
        ...hiddenCardPool.vampire
    ];
    // 過濾重複名稱 (保留第一個)
    const map = new Map();
    all.forEach(c => { if (!map.has(c.name)) map.set(c.name, c); });
    return Array.from(map.values());
})();

// 抽 5 張不重複
function drawP2PHand() {
    const shuffled = shuffle(pvpCardPool);
    return shuffled.slice(0, 5);
}

// -------- UI 更新函數 ----------
function updateP2PUI() {
    const myHpEl = document.getElementById('p2p-my-hp');
    const enemyHpEl = document.getElementById('p2p-enemy-hp');
    const myBlockEl = document.getElementById('p2p-my-block');
    const enemyBlockEl = document.getElementById('p2p-enemy-block');
    const myPoisonEl = document.getElementById('p2p-my-poison');
    const enemyPoisonEl = document.getElementById('p2p-enemy-poison');
    const myJobEl = document.getElementById('p2p-my-job');
    const enemyJobEl = document.getElementById('p2p-enemy-job');
    const myHpBar = document.getElementById('my-hp-bar');
    const enemyHpBar = document.getElementById('enemy-hp-bar');

    if (myHpEl) myHpEl.innerText = Math.max(0, p2pState.myHp);
    if (enemyHpEl) enemyHpEl.innerText = Math.max(0, p2pState.enemyHp);
    if (myBlockEl) myBlockEl.innerText = p2pState.myBlock;
    if (enemyBlockEl) enemyBlockEl.innerText = p2pState.enemyBlock;
    if (myPoisonEl) myPoisonEl.innerText = p2pState.myPoison;
    if (enemyPoisonEl) enemyPoisonEl.innerText = p2pState.enemyPoison;
    if (myJobEl) myJobEl.innerText = p2pState.myJob;
    if (enemyJobEl) enemyJobEl.innerText = p2pState.enemyJob;

    if (myHpBar) {
        const pct = Math.max(0, (p2pState.myHp / 500) * 100);
        myHpBar.style.width = pct + '%';
    }
    if (enemyHpBar) {
        const pct = Math.max(0, (p2pState.enemyHp / 500) * 100);
        enemyHpBar.style.width = pct + '%';
    }

    // 回合提示
    const indicator = document.getElementById('p2p-turn-indicator');
    const confirmBtn = document.getElementById('p2p-btn-confirm');
    const skipBtn = document.getElementById('p2p-btn-skip');
    const handArea = document.getElementById('p2p-hand');
    const enemyInfo = document.getElementById('p2p-enemy-hand-info');

    if (p2pState.phase === 'gameover') {
        indicator.innerText = p2pState.myHp <= 0 ? '💀 你戰敗了...' : '🏆 你贏得勝利！';
        indicator.style.background = p2pState.myHp <= 0 ? '#4a0f0f' : '#0f4a1a';
        indicator.style.borderColor = p2pState.myHp <= 0 ? '#ff5252' : '#69f0ae';
        if (confirmBtn) confirmBtn.disabled = true;
        if (skipBtn) skipBtn.disabled = true;
        return;
    }

    if (p2pState.isMyTurn && p2pState.phase === 'selecting') {
        indicator.innerText = '⚔️ 你的回合 — 請選擇 1~3 張卡牌';
        indicator.style.background = '#1b5e20';
        indicator.style.borderColor = '#69f0ae';
        if (confirmBtn) confirmBtn.disabled = false;
        if (skipBtn) skipBtn.disabled = false;
        confirmBtn.innerText = `⚔️ 確認出牌 (已選 ${p2pState.selectedIndices.length}/3)`;
        // 顯示手牌
        renderP2PHand();
        enemyInfo.innerText = '對手正在等待你出牌...';
    } else if (p2pState.isMyTurn && p2pState.phase === 'waiting') {
        indicator.innerText = '⏳ 已確認出牌，等待對手回應...';
        indicator.style.background = '#4a2a0f';
        indicator.style.borderColor = '#ffb74d';
        if (confirmBtn) confirmBtn.disabled = true;
        if (skipBtn) skipBtn.disabled = true;
        renderP2PHand(true); // 禁用點擊
        enemyInfo.innerText = '';
    } else if (!p2pState.isMyTurn) {
        indicator.innerText = '⏳ 對手正在思考策略...';
        indicator.style.background = '#2a0f0f';
        indicator.style.borderColor = '#ff5252';
        if (confirmBtn) confirmBtn.disabled = true;
        if (skipBtn) skipBtn.disabled = true;
        // 對手回合：隱藏手牌，顯示等待
        handArea.innerHTML = '<div style="color:#aaa; padding:20px;">等待對手出牌...</div>';
        enemyInfo.innerText = '對手正在選牌中...';
    }
}

// 渲染手牌 (可選)
function renderP2PHand(disabled = false) {
    const container = document.getElementById('p2p-hand');
    container.innerHTML = '';
    if (!p2pState.hand || p2pState.hand.length === 0) {
        container.innerHTML = '<div style="color:#666;">沒有手牌</div>';
        return;
    }
    p2pState.hand.forEach((card, idx) => {
        const div = document.createElement('div');
        div.className = `card ${card.rarity || 'common'}`;
        if (p2pState.selectedIndices.includes(idx)) div.classList.add('selected');
        if (disabled) div.classList.add('disabled');
        div.setAttribute('title', getCardTooltip(card));
        div.innerHTML = cardHtml(card);
        if (!disabled) {
            div.onclick = () => toggleSelectP2PCard(idx);
        }
        container.appendChild(div);
    });
}

// 選卡邏輯
function toggleSelectP2PCard(idx) {
    if (!p2pState.isMyTurn || p2pState.phase !== 'selecting') return;
    const pos = p2pState.selectedIndices.indexOf(idx);
    if (pos !== -1) {
        p2pState.selectedIndices.splice(pos, 1);
    } else {
        if (p2pState.selectedIndices.length >= 3) {
            p2pLog('⛔ 最多只能選 3 張卡！', '#ff4d4d');
            return;
        }
        p2pState.selectedIndices.push(idx);
    }
    updateP2PUI();
}

// 確認出牌
// 確認出牌 (已修復發送順序)
function confirmP2PPlay() {
    if (!p2pState.isMyTurn || p2pState.phase !== 'selecting') return;
    if (p2pState.selectedIndices.length === 0) {
        p2pLog('請至少選擇 1 張卡牌！', '#ff4d4d');
        return;
    }
    
    // 取得選中的卡片
    const selectedCards = p2pState.selectedIndices.map(i => p2pState.hand[i]);
    p2pState.phase = 'waiting';
    updateP2PUI();

    // 1. 先計算效果 (必須先算好，才能發送)
    const effects = calculateCardEffects(selectedCards, p2pState);
    
    // 2. 應用效果到本地狀態
    applyEffectsToState(effects, p2pState);
    updateP2PUI();
    
    // 3. 發送包含「絕對血量」的最終封包給對手
    p2pConn.send({
        type: 'APPLY_EFFECTS',
        effects: effects,
        nextTurn: true,
        syncState: {
            senderHp: p2pState.myHp,      // 出牌方(我)結算後的血量
            receiverHp: p2pState.enemyHp  // 承受方(對手)被扣完後的血量
        }
    });

    // 4. 切換回合（等待對手回應）
    p2pState.isMyTurn = false;
    p2pState.phase = 'idle';
    updateP2PUI();
    p2pLog(`⚔️ 你出牌 ${selectedCards.map(c=>c.name).join('、')}，效果已發送！`, '#2dff7a');
}

// 計算卡片效果 (針對當前狀態)
function calculateCardEffects(cards, state) {
    let damage = 0;
    let poison = 0;
    let blockSelf = 0;
    let healSelf = 0;
    let blockEnemy = 0;   // 不常用
    let healEnemy = 0;

    cards.forEach(card => {
        switch (card.type) {
            case 'atk':
                const atkDmg = (card.dmg || 0) + (state.tempStrength || 0);
                damage += atkDmg;
                break;
            case 'block':
                blockSelf += (card.block || 0);
                break;
            case 'heal':
                healSelf += (card.heal || 0);
                break;
            case 'poison':
                const pDmg = (card.dmg || 0) + (state.tempStrength || 0);
                damage += pDmg;
                poison += (card.poison || 0);
                break;
            case 'multi':
                const multiBase = (card.dmg || 0) + (state.tempStrength || 0);
                damage += multiBase * (card.hits || 1);
                break;
            case 'vul':
                // 易傷暫不實現
                break;
            case 'buff':
                // 力量暫時不實現
                break;
            case 'lifesteal':
                const lsDmg = (card.dmg || 0) + (state.tempStrength || 0);
                damage += lsDmg;
                healSelf += (card.heal || 0);
                break;
            case 'atkblock':
                const abDmg = (card.dmg || 0) + (state.tempStrength || 0);
                damage += abDmg;
                blockSelf += (card.block || 0);
                break;
            // 其他類型暫不處理
            default:
                break;
        }
    });
    return { damage, poison, blockSelf, healSelf, blockEnemy, healEnemy };
}

// 應用效果到狀態
function applyEffectsToState(effects, state) {
    // 對敵方造成傷害 (考慮敵方護甲)
    let remainingDamage = effects.damage;
    if (state.enemyBlock > 0) {
        const absorbed = Math.min(state.enemyBlock, remainingDamage);
        state.enemyBlock -= absorbed;
        remainingDamage -= absorbed;
    }
    state.enemyHp -= remainingDamage;
    // 中毒
    if (effects.poison > 0) {
        state.enemyPoison += effects.poison;
    }
    // 自身護甲
    state.myBlock += effects.blockSelf;
    // 自身治療
    state.myHp = Math.min(500, state.myHp + effects.healSelf);
    // 敵方護甲、治療（略）
    // 中毒持續傷害在回合開始時處理？先不處理，簡化。
    // 確保數值不低於0
    state.enemyHp = Math.max(0, state.enemyHp);
    state.myHp = Math.max(0, state.myHp);
    // 檢查勝負
    if (state.enemyHp <= 0 || state.myHp <= 0) {
        state.phase = 'gameover';
    }
}

// 跳過回合
function skipP2PTurn() {
    if (!p2pState.isMyTurn) return;
    p2pState.isMyTurn = false;
    p2pState.phase = 'idle';
    p2pConn.send({ type: 'SKIP_TURN' });
    p2pLog('⏭️ 你跳過了這回合', '#ffb74d');
    updateP2PUI();
}

// -------- 連線核心 (修改) ----------
function openP2PModal() {
    document.getElementById("p2pModal").style.display = "flex";
    if (typeof state !== 'undefined' && state.job) {
        p2pState.myJob = state.job;
    }
    // 重置狀態
    p2pState.myHp = 500;
    p2pState.enemyHp = 500;
    p2pState.myBlock = 0;
    p2pState.enemyBlock = 0;
    p2pState.myPoison = 0;
    p2pState.enemyPoison = 0;
    p2pState.isMyTurn = false;
    p2pState.phase = 'idle';
    p2pState.hand = [];
    p2pState.selectedIndices = [];
    updateP2PUI();
    document.getElementById('p2p-enemy-hand-info').innerText = '';
}

function closeP2PModal() {
    document.getElementById("p2pModal").style.display = "none";
    if (p2pConn) p2pConn.close();
    if (p2pPeer) p2pPeer.destroy();
    p2pConn = null;
    p2pPeer = null;
    document.getElementById("p2p-setup-zone").style.display = "block";
    document.getElementById("p2p-battle-zone").style.display = "none";
    document.getElementById("my-peer-id").innerText = "";
    document.getElementById("p2p-status").innerText = "目前狀態：連線已斷開";
}

function copyPeerID() {
    const idText = document.getElementById("my-peer-id").innerText.trim();
    if (!idText) {
        p2pLog("[系統] 尚未產生聯機碼，請先點擊創建房間！", "#ff4d4d");
        return;
    }
    navigator.clipboard.writeText(idText).then(() => {
        p2pLog("✅ 聯機碼已成功複製！", "#2dff7a");
    }).catch(() => {
        p2pLog(`❌ 複製失敗，手動複製：${idText}`, "#ff4d4d");
    });
}

function p2pLog(msg, color = "#2dff7a") {
    const logBox = document.getElementById("p2p-log");
    if (logBox) {
        logBox.innerHTML += `<div style="color:${color}">${msg}</div>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function initP2PHost() {
    p2pLog("[系統] 創建房間...", "#ffd54f");
    p2pPeer = new Peer();
    p2pPeer.on('open', (id) => {
        document.getElementById("my-peer-id").innerText = id;
        document.getElementById("p2p-status").innerText = "房間創建成功！請複製聯機碼給朋友。";
        p2pLog(`[系統] 房間 ID: ${id}`);
        p2pState.role = 'host';
    });
    p2pPeer.on('connection', (connection) => {
        p2pConn = connection;
        setupConnectionHandlers();
    });
}

function connectToPeer() {
    const targetId = document.getElementById("peer-target-id").value.trim();
    if (!targetId) {
        alert("請輸入對方的聯機碼！");
        return;
    }
    p2pLog("[系統] 正在連接...", "#ffd54f");
    p2pPeer = new Peer();
    p2pPeer.on('open', () => {
        p2pState.role = 'guest';
        p2pConn = p2pPeer.connect(targetId);
        setupConnectionHandlers();
    });
}

// 處理所有的 P2P 連線狀態與接收資料
function setupConnectionHandlers() {
    // 1. 連線開啟時的處理
    p2pConn.on('open', () => {
        document.getElementById("p2p-status").innerText = "🟢 連線成功！對戰開始！";
        document.getElementById("p2p-setup-zone").style.display = "none";
        document.getElementById("p2p-battle-zone").style.display = "block";
        p2pLog("[系統] 靈魂連結建立！", "#2dff7a");
        if (typeof AudioManager !== 'undefined') AudioManager.playBGM('battle');

        p2pConn.send({ type: 'HANDSHAKE', job: p2pState.myJob });

        p2pState.myHp = 500;
        p2pState.enemyHp = 500;
        p2pState.myBlock = 0;
        p2pState.enemyBlock = 0;
        p2pState.myPoison = 0;
        p2pState.enemyPoison = 0;

        if (p2pState.role === 'host') {
            p2pState.isMyTurn = true;
            p2pState.phase = 'selecting';
            p2pState.hand = drawP2PHand();
            p2pState.selectedIndices = [];
            p2pLog('⚔️ 你為房東，先攻！請選擇卡牌', '#ffd54f');
        } else {
            p2pState.isMyTurn = false;
            p2pState.phase = 'idle';
            p2pLog('⏳ 等待房東出牌...', '#ffd54f');
        }
        updateP2PUI();
    });

    // 2. 接收到對手資料時的處理 (已修復同步邏輯)
    p2pConn.on('data', (data) => {
        if (data.type === 'HANDSHAKE') {
            p2pState.enemyJob = data.job;
            p2pLog(`[對手] 職業：${data.job}`, '#ff4d4d');
            updateP2PUI();
        }
        else if (data.type === 'APPLY_EFFECTS') {
            const effects = data.effects;
            
            // 強制狀態同步
            if (data.syncState) {
                p2pState.enemyHp = data.syncState.senderHp;
                p2pState.myHp = data.syncState.receiverHp;
            } else {
                if (effects.damage > 0) {
                    let dmg = effects.damage;
                    if (p2pState.myBlock > 0) {
                        const absorbed = Math.min(p2pState.myBlock, dmg);
                        p2pState.myBlock -= absorbed;
                        dmg -= absorbed;
                    }
                    p2pState.myHp -= dmg;
                }
            }

            if (effects.damage > 0) p2pLog(`💥 受到 ${effects.damage} 點傷害！`, '#ff4d4d');
            if (effects.poison > 0) {
                p2pState.myPoison += effects.poison;
                p2pLog(`☠️ 被施加 ${effects.poison} 中毒`, '#7cff7c');
            }
            
            if (p2pState.myHp <= 0 || p2pState.enemyHp <= 0) {
                p2pState.phase = 'gameover';
                updateP2PUI();
                return;
            }

            p2pState.isMyTurn = true;
            p2pState.phase = 'selecting';
            p2pState.hand = drawP2PHand();
            p2pState.selectedIndices = [];
            p2pLog('🔄 輪到你的回合！', '#2dff7a');
            updateP2PUI();
        }
        else if (data.type === 'SKIP_TURN') {
            p2pState.isMyTurn = true;
            p2pState.phase = 'selecting';
            p2pState.hand = drawP2PHand();
            p2pState.selectedIndices = [];
            p2pLog('⏭️ 對手跳過，輪到你了', '#ffb74d');
            updateP2PUI();
        }
        else if (data.type === 'GAME_OVER') {
            p2pState.phase = 'gameover';
            p2pState.myHp = 0; 
            updateP2PUI();
        }
    });

    // 3. 連線斷開時的處理
    p2pConn.on('close', () => {
        p2pLog("[系統] 連線已中斷", "#ff4d4d");
        document.getElementById("p2p-status").innerText = "🔴 連線中斷";
        p2pState.phase = 'gameover';
        updateP2PUI();
    });
}
// 重寫 executeP2PAction (廢棄，改用 confirmP2PPlay)
// 保留空函數避免舊按鈕報錯
function executeP2PAction() {}
// ==========================================
// P2P 狀態強制同步系統 (放在檔案最下方)
// ==========================================

/**
 * 1. 強化版的發送函式：負責出牌、扣血、並打包絕對血量
 * (請將你原本卡牌點擊後執行的函式，改為呼叫這個 P2P_PlayCardAndSync)
 */
function P2P_PlayCardAndSync(cardData) {
    // 【防呆機制】不是自己的回合，直接阻擋
    if (!p2pState.isMyTurn) {
        console.warn("⚠️ 還沒輪到你，無法出牌！");
        return;
    }

    // 本地端先扣除對手血量 (假設 cardData 裡面有 damage 屬性)
    p2pState.enemyHp -= cardData.damage;
    
    // 打包準備傳送的資料，加入關鍵的 syncState
    const payload = {
        type: 'APPLY_EFFECTS',
        cardId: cardData.id,
        damage: cardData.damage,
        // 強制同步的絕對狀態
        syncState: {
            senderHp: p2pState.myHp,      // 發送方（我）當下的血量
            receiverHp: p2pState.enemyHp  // 接收方（敵人）當下的血量
        }
    };

    // 透過 PeerJS 送出封包
    if (conn && conn.open) {
        conn.send(payload);
    } else {
        console.error("❌ 連線異常，封包發送失敗");
    }

    // 出牌完畢，將回合權限交給對手
    p2pState.isMyTurn = false; 

    // 更新畫面 (請替換成你遊戲中實際用來刷新 UI 的函式)
    if (typeof updateUI === 'function') updateUI();
}


/**
 * 2. 強化版的接收函式：負責接收封包並「強制覆寫」本地狀態
 * (請在你的 conn.on('data', ...) 內部呼叫這個 P2P_HandleIncomingData)
 */
function P2P_HandleIncomingData(data) {
    if (data.type === 'APPLY_EFFECTS') {
        console.log("📥 收到對手攻擊，執行狀態強制覆蓋...");

        // 【狀態覆蓋機制】強制將本地血量替換為對手算好的絕對數值
        if (data.syncState) {
            p2pState.enemyHp = data.syncState.senderHp;   // 對方的血量
            p2pState.myHp = data.syncState.receiverHp;    // 我的血量
        } else {
            // 如果封包沒有 syncState 的備用方案
            p2pState.myHp -= data.damage; 
        }

        // 對方出完牌了，現在輪到我的回合
        p2pState.isMyTurn = true;

        // 更新畫面 (請替換成你遊戲中實際用來刷新 UI 的函式)
        if (typeof updateUI === 'function') updateUI();
    }
}
function goToStockGame() {
    // 禾
    saveGame();
    // 114514
    window.location.href = 'game2.html';
}
// 🆕 頁面關閉或切換時自動存檔
window.addEventListener('beforeunload', function() {
    saveGame();
    console.log('💾 自動存檔完成');
});
// ============================================================
// 📈 背景股市模擬（與遊戲二共用數據）
// ============================================================

// ----- 1. 股市數據結構 -----
const STOCK_SYMBOLS = [
    { id: 'TECH', name: '未來科技', code: 'FT.01' },
    { id: 'HEAL', name: '健康醫藥', code: 'HM.02' },
    { id: 'ENER', name: '能源集團', code: 'EG.03' },
    { id: 'AI', name: 'AI晶片', code: 'AI.04' },
    { id: 'RETA', name: '消費零售', code: 'CR.05' }
];

const STOCK_HISTORY_LENGTH = 30;

// ----- 2. 讀取／初始化股市數據 -----
function loadStockMarketData() {
    try {
        const raw = localStorage.getItem('stock_market_data');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.stocks && data.stocks.length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.warn('讀取股市數據失敗，重新初始化', e);
    }
    return initStockMarketData();
}


function initStockMarketData() {
    const stocks = STOCK_SYMBOLS.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        price: Math.round((50 + Math.random() * 300) * 100) / 100,
        history: [],
        volume: 500 + Math.floor(Math.random() * 5000)  // ✅ 加入這行
    }));
    // 每支股票填入初始歷史價格
    stocks.forEach(s => {
        for (let i = 0; i < STOCK_HISTORY_LENGTH; i++) {
            s.history.push(s.price);
        }
    });
    const data = {
        stocks: stocks,
        lastUpdate: Date.now()
    };
    localStorage.setItem('stock_market_data', JSON.stringify(data));
    return data;
}
    
    const data = {
        stocks: stocks,
        lastUpdate: Date.now()
    };
    localStorage.setItem('stock_market_data', JSON.stringify(data));
    


// ----- 3. 更新股價（隨機波動 + 趨勢 + 漲跌停 + 成交量） -----
let marketTrend = 0;
let trendTimer = 0;

function updateStockPrices() {
    let data = loadStockMarketData();
    let changed = false;
    
    // 每 8~12 次更新切換一次趨勢
    trendTimer++;
    if (trendTimer > 8 + Math.floor(Math.random() * 5)) {
        trendTimer = 0;
        marketTrend = (Math.random() - 0.5) * 0.03;
        console.log(`📈 市場趨勢改變：${marketTrend > 0 ? '多頭' : '空頭'} (${(marketTrend * 100).toFixed(2)}%)`);
    }
    
    const MAX_CHANGE = 0.07; // 7% 漲跌停
    
    data.stocks.forEach(stock => {
        const baseVolatility = 0.015 + Math.random() * 0.01;
        let eventBonus = 0;
        if (Math.random() < 0.03) {
            eventBonus = (Math.random() - 0.5) * 0.06;
        }
        let changePercent = marketTrend + (Math.random() * 2 - 1) * baseVolatility + eventBonus;
        changePercent = Math.max(-MAX_CHANGE, Math.min(MAX_CHANGE, changePercent));
        
        let newPrice = stock.price * (1 + changePercent);
        if (newPrice < 0.5) newPrice = 0.5;
        if (newPrice > 9999) newPrice = 9999;
        newPrice = Math.round(newPrice * 100) / 100;
        
        if (newPrice !== stock.price) {
            changed = true;
            stock.price = newPrice;
        }
        
        stock.history.push(newPrice);
        if (stock.history.length > STOCK_HISTORY_LENGTH) {
            stock.history.shift();
        }
        
        // 成交量更新
        stock.volume = stock.volume || (500 + Math.floor(Math.random() * 5000));
        stock.volume = Math.max(100, Math.floor(stock.volume * (1 + (Math.random() - 0.5) * 0.3)));
    });
    
    if (changed) {
        data.lastUpdate = Date.now();
        localStorage.setItem('stock_market_data', JSON.stringify(data));
    }
}
// ----- 4. 啟動定時器（每 60 秒更新一次） -----
let stockTimer = null;

function startStockMarketTicker() {
    if (stockTimer) {
        clearInterval(stockTimer);
        stockTimer = null;
    }
    // 先初始化數據（如果不存在）
    if (!localStorage.getItem('stock_market_data')) {
        initStockMarketData();
    }
    // 啟動定時器
    stockTimer = setInterval(updateStockPrices, 60000);
    console.log('📈 股市背景模擬已啟動（每60秒更新）');
}

// ----- 5. 停止定時器（頁面關閉時清理） -----
function stopStockMarketTicker() {
    if (stockTimer) {
        clearInterval(stockTimer);
        stockTimer = null;
        console.log('📈 股市背景模擬已停止');
    }
}

// ----- 6. 自動啟動（在遊戲載入時） -----
// 檢查是否已存在股市數據，若無則初始化
if (!localStorage.getItem('stock_market_data')) {
    initStockMarketData();
}
// 啟動定時器
startStockMarketTicker();

// 頁面關閉或切換時停止定時器
window.addEventListener('beforeunload', function() {
    stopStockMarketTicker();
    // 確保股市數據已保存
    updateStockPrices();
});

// ----- 7. 手動觸發更新（可用於測試） -----
// 在瀏覽器主控台輸入 updateStockPrices() 可手動更新
// 觸發格擋 QTE 判定
function triggerParryQTE(baseDamage, onComplete) {
  // 40% 機率觸發格擋
  const canParry = Math.random() < 0.4;

  if (!canParry) {
    // 沒觸發格擋，直接 100% 受擊
    onComplete(baseDamage, "無法格擋！");
    return;
  }

  const overlay = document.getElementById('parry-overlay');
  const container = document.getElementById('parry-nodes-container');
  const timerFill = document.getElementById('parry-timer-fill');

  container.innerHTML = '';
  overlay.classList.remove('hidden');

  // 隨機產生 2 個正確點位 (0~4)
  const correctIndices = [];
  while (correctIndices.length < 2) {
    const rand = Math.floor(Math.random() * 5);
    if (!correctIndices.includes(rand)) correctIndices.push(rand);
  }

  let selectedIndices = [];
  let isResolved = false;
  const duration =5000; // 倒數 5 秒
  const startTime = Date.now();

  const timerInterval = setInterval(() => {
    if (isResolved) return;
    const elapsed = Date.now() - startTime;
    const remainingRatio = Math.max(0, 1 - elapsed / duration);
    timerFill.style.width = (remainingRatio * 100) + '%';

    if (elapsed >= duration) {
      clearInterval(timerInterval);
      resolveParry(0); // 時間到，算猜中 0 個
    }
  }, 30);

  // 動態生成 5 個按鈕
  for (let i = 0; i < 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'parry-node';
    btn.innerText = i + 1;

    btn.onclick = () => {
      if (isResolved || selectedIndices.includes(i)) return;

      selectedIndices.push(i);
      btn.classList.add('selected');

      if (selectedIndices.length === 2) {
        clearInterval(timerInterval);
        const correctCount = selectedIndices.filter(idx => correctIndices.includes(idx)).length;
        
        selectedIndices.forEach(idx => {
          const el = container.children[idx];
          if (correctIndices.includes(idx)) el.classList.add('correct');
          else el.classList.add('wrong');
        });

        setTimeout(() => resolveParry(correctCount), 400);
      }
    };
    container.appendChild(btn);
  }

  function resolveParry(hits) {
    if (isResolved) return;
    isResolved = true;
    overlay.classList.add('hidden');

    let finalDamage = baseDamage;
    let msg = "";

    if (hits === 2) {
      finalDamage = 0;
      msg = "🛡️ 完美格擋！（無傷害）";
    } else if (hits === 1) {
      finalDamage = Math.floor(baseDamage * 0.5);
      msg = "🛡️ 部分格擋！（傷害 50%）";
    } else {
      finalDamage = baseDamage;
      msg = "❌ 格擋失敗！（傷害 100%）";
    }

    onComplete(finalDamage, msg);
  }
}
// ----------------------------------------------------
// 自動產生閃躲按鈕的 UI 函式
// ----------------------------------------------------
function showDodgeButton(currentHit, totalHit, callback) {
    // 1. 先找看看畫面上是不是已經有 QTE 畫面了，沒有的話就建立一個
    let qteBox = document.getElementById("dodge-qte-box");
    
    if (!qteBox) {
        qteBox = document.createElement("div");
        qteBox.id = "dodge-qte-box";
        // 設定畫面樣式：浮在螢幕正中間的黑色半透明視窗
        qteBox.style.position = "fixed";
        qteBox.style.top = "50%";
        qteBox.style.left = "50%";
        qteBox.style.transform = "translate(-50%, -50%)";
        qteBox.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
        qteBox.style.padding = "20px 30px";
        qteBox.style.borderRadius = "12px";
        qteBox.style.border = "3px solid #ffcc00";
        qteBox.style.zIndex = "9999";
        qteBox.style.textAlign = "center";
        qteBox.style.boxShadow = "0 0 20px rgba(255, 204, 0, 0.5)";
        document.body.appendChild(qteBox);
    }

    // 2. 在視窗裡面放入文字與閃避按鈕
    qteBox.innerHTML = `
        <div style="color: #ffffff; font-size: 18px; margin-bottom: 15px; font-weight: bold;">
            ⚡ 連續閃避中 (${currentHit} / ${totalHit})
        </div>
        <button id="real-dodge-btn" style="
            padding: 12px 30px;
            font-size: 22px;
            font-weight: bold;
            color: white;
            background-color: #ff4444;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(255, 68, 68, 0.6);
            transition: transform 0.1s;
        ">
            💨 快按！閃躲！
        </button>
    `;

    let btn = document.getElementById("real-dodge-btn");
    let hasClicked = false; // 用來防止重複點擊

    // 3. 設定計時器：如果 0.35 秒內沒按，就算失敗
    let timer = setTimeout(() => {
        if (!hasClicked) {
            hasClicked = true;
            qteBox.remove(); // 把按鈕視窗關掉
            callback(false);  // 傳回：失敗
        }
    }, 350); // 350 毫秒 (0.35秒) 反應時間

    // 4. 點擊按鈕事件：按到了算成功
    btn.onclick = function() {
        if (!hasClicked) {
            hasClicked = true;
            clearTimeout(timer); // 停止倒數
            qteBox.remove();     // 把按鈕視窗關掉
            callback(true);      // 傳回：成功
        }
    };
}span></div>
<div class="stat">💪 力量：<span id="strength"></span></div>
<div class="stat">🌟 進化點數：<span id="evoPoints"></span></div>
<button id="evolveBtn" class="btn evolution-btn" onclick="evolveJob()">🌟 職業進化</button>
<div id="hiddenJobBtn" style="margin-top:8px;"></div>
<h3>🎭 職業</h3>
<div class="toprow">
<button class="btn" id="jobWarrior" onclick="setJob('warrior')">⚔️ 戰士</button>
<button class="btn" id="jobMage" onclick="setJob('mage')">🔮 法師</button>
<button class="btn" id="jobAssassin" onclick="setJob('assassin')">🗡️ 刺客</button>
</div>
<div id="jobInfo" class="small"></div>
<div id="evolvedInfo" class="small" style="color:#ffaa66;"></div>
<h3>📦 牌組</h3>
<div class="stat">抽牌堆：<span id="deckCount"></span></div>
<div class="stat">棄牌堆：<span id="discardCount"></span></div>
<div class="toprow">
<button class="btn" onclick="openDeckView()">查看牌組</button>
<button class="btn" onclick="openDrawModal()">✨ 抽卡</button>
<button class="btn" onclick="openBlackMarket()">💰 奸商</button>
<button class="btn" onclick="openWheelModal()">🎡 幸運轉盤</button>
</div>
<div class="audio-controls" style="margin-bottom: 16px; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid #5f4632; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
    <button id="muteBtn" class="btn" style="margin: 0; padding: 4px 12px; font-size: 13px; min-width: 90px;" onclick="AudioManager.toggleMute()">🔊 音效：開</button>
    <div style="display: flex; align-items: center; gap: 4px; flex: 1;">
        <span style="font-size: 12px; color: #f5e6c8; white-space: nowrap;">音量：</span>
        <input id="volumeSlider" type="range" min="0" max="1" step="0.05" value="0.5" style="width: 100%; cursor: pointer;" oninput="AudioManager.setVolume(this.value)">
    </div>
</div>
<h3>🧿 遺物</h3>
<div id="relics"></div>
</div>
<div class="panel">
<h2>🗺️ 深淵地圖</h2>
<div id="map" class="map"></div>
<h2 style="margin-top:18px">👾 敵人</h2>
<div id="enemyArea"></div>
<div class="battle-controls">
<div class="action-buttons">
<button class="btn" onclick="endTurn()">🔁 結束回合</button>
<button class="btn" onclick="saveGame()">💾 存檔</button>
<button class="btn" onclick="loadGame()">📀 讀檔</button>
</div>
</div>
<h2 style="margin-top:18px">🎴 手牌</h2>
<div id="hand" class="hand"></div>
</div>
<div class="panel">
<h2>📜 冒險日誌</h2>
<div id="log" class="log"></div>
</div>
</div>

<!-- 模态框 -->
<div class="modal" id="shopModal"><div class="modal-content"><h2>🛒 商店</h2><div>魂石：<span id="shopGold"></span></div><div id="shopCards" class="shop-grid"></div><div style="margin-top:18px; display:flex; gap:12px; flex-wrap:wrap; align-items:center;"><button class="btn" onclick="refreshShop()">🔄 刷新商品 (50石)</button><button class="btn" onclick="healShop()">❤️ 回復30HP（25）</button><button class="btn" onclick="removeCardShop()">🗑️ 刪除卡牌（35）</button><button class="btn" onclick="closeShop()">離開商店</button></div></div></div>
<div class="modal" id="blackMarketModal"><div class="modal-content"><h2>💰 奸商（三倍價格）</h2><p class="small">戰鬥中也可購買，購買後立即刷新商品</p><div>魂石：<span id="blackGold"></span></div><div id="blackCards" class="shop-grid"></div><button class="btn" onclick="closeBlackMarket()">關閉</button></div></div>
<div class="modal" id="rewardModal"><div class="modal-content"><h2>🎁 選擇一張卡牌</h2><div id="rewardCards" class="reward-grid"></div></div></div>
<div class="modal" id="deckModal"><div class="modal-content"><h2>📚 牌組</h2><div id="deckView" class="reward-grid"></div><button class="btn" onclick="closeDeckView()">關閉</button></div></div>
<div class="modal" id="drawModal"><div class="modal-content"><h2>✨ 抽卡系統</h2><p>魂石：<span id="drawGold"></span></p><p class="small">抽卡會解鎖一張全新卡牌，解鎖後將出現在商店（與一般商品混合），可無限購買</p><div style="display:flex; gap:12px; margin:16px 0; align-items:center;"><div><button class="btn" onclick="drawSingle()">單抽 100 石</button><button class="btn" onclick="drawTen()">十連抽 980 石</button></div><button class="btn" onclick="openCollectionModal()">📖 圖鑑</button></div><div id="drawResultArea" class="reward-grid"></div><button class="btn" onclick="closeDrawModal()">關閉</button></div></div>
<div class="modal" id="collectionModal"><div class="modal-content"><h2>📖 卡牌圖鑑</h2><p class="small">抽卡池收集狀態（抽到後解鎖）</p><div id="collectionGrid" class="collection-grid"></div><button class="btn" onclick="closeCollectionModal()">關閉</button></div></div>
<div class="modal" id="wheelModal"><div class="modal-content"><h2>🎡 幸運轉盤</h2><p class="small">花費 60 魂石，指針停止處即為獲得的卡牌（直接加入牌組）</p><div class="wheel-container"><canvas id="wheelCanvas" width="500" height="500"></canvas><div class="pointer"></div><div class="wheel-center"></div></div><button id="wheelSpinBtn" class="wheel-button">開始旋轉</button><div id="wheelResultText" class="result-text"></div><button class="btn" onclick="closeWheelModal()" style="margin-top:20px;">關閉</button></div></div>
<div class="modal" id="equipmentModal"><div class="modal-content" style="width:650px;"><h2>⚔️ 裝備管理・稀有度升級</h2><div id="equipmentSlots"></div><button class="btn" onclick="closeEquipmentModal()">關閉</button></div></div>


<!-- ⚔️ P2P 獨立全螢幕競技場畫面 -->
<div id="p2pModal" class="p2p-fullscreen-arena" style="display:none;">
    <div class="arena-wrapper">
        <div class="arena-header">
            <h1>⚔️ 跨時空聯機競技場</h1>
            <p>Peer-to-Peer Realtime Arena</p>
        </div>
        
        <!-- 【區域 A】連線與大廳設定區 (開戰後會自動隱藏) -->
        <div id="p2p-setup-zone" class="arena-setup-panel">
            <div class="setup-row">
                <button class="btn host-btn" onclick="initP2PHost()">1. 創建房間 (成為房東)</button>
                <div class="id-display-box">
                    <span id="my-peer-id" class="selectable-id"></span>
                </div>
                <button class="btn copy-btn" onclick="copyPeerID()">📋 複製聯機碼</button>
            </div>
            <div class="setup-row">
                <input type="text" id="peer-target-id" placeholder="請輸入對方的房間聯機碼..." class="arena-input">
                <button class="btn join-btn" onclick="connectToPeer()">2. 跨越虛空加入對戰</button>
            </div>
            <div id="p2p-status" class="arena-status-text">目前狀態：等待裂縫開啟...</div>
        </div>

<!-- 【區域 B】史詩級戰鬥主面板 -->
<div id="p2p-battle-zone" class="arena-battle-board" style="display: none;">
    <div class="fighter-container">
        <!-- 我方 -->
        <div class="fighter-card my-side">
            <div class="fighter-tag">YOU</div>
            <div class="fighter-job" id="p2p-my-job">-</div>
            <div class="hp-bar-outer"><div id="my-hp-bar" class="hp-bar-inner" style="width:100%;"></div></div>
            <div class="fighter-hp">HP: <span id="p2p-my-hp">500</span></div>
            <div class="fighter-status">🛡️ 護甲: <span id="p2p-my-block">0</span> &nbsp; ☠️ 中毒: <span id="p2p-my-poison">0</span></div>
        </div>
        <div class="vs-sign">VS</div>
        <!-- 對手 -->
        <div class="fighter-card enemy-side">
            <div class="fighter-tag">ENEMY</div>
            <div class="fighter-job" id="p2p-enemy-job">-</div>
            <div class="hp-bar-outer"><div id="enemy-hp-bar" class="hp-bar-inner" style="width:100%;"></div></div>
            <div class="fighter-hp">HP: <span id="p2p-enemy-hp">500</span></div>
            <div class="fighter-status">🛡️ 護甲: <span id="p2p-enemy-block">0</span> &nbsp; ☠️ 中毒: <span id="p2p-enemy-poison">0</span></div>
        </div>
    </div>

    <!-- 回合提示 -->
    <div id="p2p-turn-indicator" class="arena-turn-banner">等待對手連線...</div>

    <!-- 手牌區域（僅在自己的回合顯示） -->
    <div id="p2p-hand-area" style="margin: 16px 0;">
        <div id="p2p-hand" class="p2p-hand"></div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 12px;">
            <button id="p2p-btn-confirm" class="btn" onclick="confirmP2PPlay()" disabled style="background:#2dff7a; color:#000;">⚔️ 確認出牌 (已選 0/3)</button>
            <button id="p2p-btn-skip" class="btn" onclick="skipP2PTurn()" style="background:#555;">⏭️ 跳過回合</button>
        </div>
    </div>

    <!-- 對手持牌（只顯示已選數量） -->
    <div id="p2p-enemy-hand-info" style="text-align:center; color:#aaa; font-size:14px; margin-bottom:10px;"></div>
</div>
        <!-- 【區域 C】下方：日誌與退出 -->
        <div class="arena-footer">
            <div id="p2p-log" class="arena-live-log">
                [系統] 虛空競技場已就緒。
            </div>
            <button class="btn quit-btn" onclick="closeP2PModal()">放棄對決 · 關閉退出</button>
        </div>
    </div>
</div>

<script src="script.js"></script>
</body>
</html>
