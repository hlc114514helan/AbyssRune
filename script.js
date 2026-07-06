// ==========================================
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
function dealDamage(dmg){ let isCrit=false; if(state.job==="assassin" && Math.random()<0.2){ dmg=Math.floor(dmg*state.critBonusMult); isCrit=true; } if(state.enemy.vulnerable>0) dmg=Math.floor(dmg*1.5); state.enemy.hp-=dmg; log(`⚔️ 造成 ${dmg} 傷害${isCrit?" 暴擊":""}`); for(let r of state.relics) if(r.effect) r.effect("attack"); let enemyDiv=document.getElementById("enemyBox"); if(enemyDiv){ enemyDiv.classList.add("damage"); setTimeout(()=>{ enemyDiv.classList.remove("damage"); },180); } }
function playCard(i){ if(!state.enemy) return; let card=state.hand[i]; if(!card) return; let energyCost=card.cost; if(state.job==="ranger" && card.type==="atk" && !state.rangerFirstAttackFree){ energyCost=0; state.rangerFirstAttackFree=true; log("🏹 遊俠被動：首次攻擊不消耗能量"); } if(state.energy<energyCost){ log("⚡ 能量不足"); return; } if(card.once && state.usedOnceCards.includes(card.name)){ log("❌ 此卡本回合已使用"); return; } state.energy-=energyCost; state.hand.splice(i,1); if(card.once) state.usedOnceCards.push(card.name); switch(card.type){ case "atk": let atkDmg=card.dmg+state.strength+state.tempStrength; dealDamage(atkDmg); if(card.vulnerable) state.enemy.vulnerable+=card.vulnerable; break; case "block": state.block+=card.block; log(`🛡️ 獲得 ${card.block} 護甲`); break; case "poison": let poisonDmg=card.dmg+state.strength+state.tempStrength; dealDamage(poisonDmg); state.enemy.poison+=card.poison; log(`☠️ 敵人中毒 ${card.poison}`); break; case "multi": let multiBase=card.dmg+state.strength+state.tempStrength; for(let x=0;x<card.hits;x++) dealDamage(multiBase); break; case "energy": state.energy+=card.gain; draw(card.draw); log(`⚡ +${card.gain} 能量`); break; case "vul": state.enemy.vulnerable+=card.vulnerable; log(`💥 敵人易傷 ${card.vulnerable}`); break; case "buff": state.strength+=card.strength; log(`💪 力量 +${card.strength}`); break; case "poisonburst": let dmg=(state.enemy.poison||0)*3; state.enemy.hp-=dmg; state.enemy.poison=0; log(`💣 毒爆造成 ${dmg} 傷害，中毒清除`); break; case "percentdmg": let percentDmg=Math.floor(state.enemy.maxHp*card.percent); state.enemy.hp-=percentDmg; log(`🌑 深淵降臨造成 ${percentDmg} 傷害`); break; case "fullheal": state.hp=state.maxHp; log(`❤️ 生命已回滿`); let targetHandSize=10; while(state.hand.length<targetHandSize && (state.deck.length>0||state.discard.length>0)) draw(1); log(`🃏 抽滿手牌`); break; case "lifesteal": dealDamage(card.dmg+state.strength+state.tempStrength); heal(card.heal); log(`🩸 恢復 ${card.heal} HP`); break; case "heal": heal(card.heal); log(`❤️ 恢復 ${card.heal} HP`); break; case "atkblock": let abDmg=card.dmg+state.strength+state.tempStrength; dealDamage(abDmg); state.block+=card.block; log(`🛡️ 獲得 ${card.block} 護甲`); break; case "debuff": if(card.effect) card.effect(); break; } if(state.job==="vampire" && (card.type==="atk"||card.type==="multi") && card.type!=="lifesteal"){ let totalDamage=0; if(card.type==="atk") totalDamage=card.dmg+state.strength+state.tempStrength; if(card.type==="multi") totalDamage=(card.dmg+state.strength+state.tempStrength)*card.hits; let healAmount=Math.floor(totalDamage*(state.vampireHealRatio+(state.vampireHealBonus||0))); heal(healAmount); log(`🩸 吸血鬼被動：吸血 ${healAmount}`); } state.discard.push(card); if(state.enemy && state.enemy.hp<=0){ victory(); return; } render(); }
function endTurn(){ if(!state.enemy) return; while(state.hand.length) state.discard.push(state.hand.pop()); state.tempStrength=0; if(state.job==="ranger") state.rangerFirstAttackFree=false; enemyTurn(); }
function enemyTurn(){ if(!state.enemy) return; if(state.enemy.poison>0){ state.enemy.hp-=state.enemy.poison; log(`☠️ 敵人中毒 ${state.enemy.poison}`); state.enemy.poison--; if(state.enemy.hp<=0){ victory(); return; } } if(state.enemy.rank==="boss" && state.enemy.hp<state.enemy.maxHp*0.5 && !state.enemy.rage){ state.enemy.rage=true; state.enemy.atk+=8; log("🔥 Boss 狂暴化！"); } let dmg=state.enemy.atk; if(state.enemy.nextTurnAtkMod){ dmg=Math.floor(dmg*state.enemy.nextTurnAtkMod); delete state.enemy.nextTurnAtkMod; log("🌀 陷阱效果：敵人攻擊力減半"); } if(state.enemy.vulnerable>0) state.enemy.vulnerable--; dmg=Math.max(0,dmg-state.block); state.hp-=dmg; log(`👾 敵人造成 ${dmg} 傷害`); for(let r of state.relics) if(r.effect) r.effect("hit",dmg); if(state.hp<=0){ die(); return; } startTurn(); }
function victory(){
    // 🎵 【音效觸發】播放戰鬥勝利音樂
    if (typeof AudioManager !== 'undefined') AudioManager.playBGM('victory');

    state.inBattle = false;
    let rewardGold = 25 + state.floor * 5;
    if(state.enemy.rank === "elite") rewardGold *= 2;
    if(state.enemy.rank === "boss") rewardGold *= 4;
    state.gold += rewardGold;
    
    // 📜 於主日誌印出華麗的勝利訊息
    log(`<b style="color:#facc15; font-size:1.1rem;">✨ ⚔️ 【 戰 鬥 勝 利 】 ⚔️ ✨</b>`);
    log(`🏆 順利擊敗強敵，獲得 ${rewardGold} 魂石！`);
    
    if(state.enemy.rank === "boss" && state.floor >= 30){
        state.evolutionPoints++;
        log(`🌟 獲得進化點數！可用於職業進化（目前 ${state.evolutionPoints} 點）`);
    }
    
    state.enemy = null;
    state.floor++;
    generateMap();
    render();

    // ====================================================
    // 🎯 【新功能】動態在螢幕正中央建立大大的 VICTORY 字樣
    // ====================================================
    const victoryEffect = document.createElement("div");
    victoryEffect.innerText = "VICTORY";
    
    // 設定華麗的純 JavaScript 特效樣式（免動 CSS 檔案）
    victoryEffect.style.position = "fixed";
    victoryEffect.style.top = "45%";
    victoryEffect.style.left = "50%";
    victoryEffect.style.transform = "translate(-50%, -50%) scale(0.3)"; // 從小變大
    victoryEffect.style.color = "#facc15"; // 傳說級金色
    victoryEffect.style.fontSize = "5.5rem";
    victoryEffect.style.fontWeight = "900";
    victoryEffect.style.letterSpacing = "10px";
    victoryEffect.style.textShadow = "0 0 25px rgba(250, 204, 21, 0.7), 0 0 50px rgba(0, 0, 0, 0.9)";
    victoryEffect.style.zIndex = "99999"; // 確保蓋在最上層
    victoryEffect.style.opacity = "0";
    victoryEffect.style.pointerEvents = "none"; // 點擊穿透，不干擾操作
    victoryEffect.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; // 彈性跳出動畫
    
    document.body.appendChild(victoryEffect);

    // 延遲微秒觸發「跳出並淡入」動畫
    setTimeout(() => {
        victoryEffect.style.opacity = "1";
        victoryEffect.style.transform = "translate(-50%, -50%) scale(1)";
    }, 30);

    // ====================================================
    // ⏳ 讓 VICTORY 字樣停留 1.5 秒後淡出，並隨後「給玩家選牌卡」
    // ====================================================
    setTimeout(() => {
        // 字樣逐漸放大並淡出
        victoryEffect.style.opacity = "0";
        victoryEffect.style.transform = "translate(-50%, -50%) scale(1.2)";
        
        // 動畫結束後徹底移除該標籤
        setTimeout(() => { victoryEffect.remove(); }, 400);
        
        // 🎁 字樣消失後，正式彈出選牌視窗！
        showCardReward();
    }, 1500); 
}
function showCardReward(){
    let modal=document.getElementById("rewardModal");
    let area=document.getElementById("rewardCards");
    area.innerHTML="";
    let rewards=[];
    let pool=getNormalCards();
    for(let i=0;i<3;i++) rewards.push(copyCard(pool[Math.floor(Math.random()*pool.length)]));
    rewards.forEach(card=>{
        let div=document.createElement("div");
        div.className=`card ${card.rarity}`;
        div.setAttribute("title",getCardTooltip(card));
        div.innerHTML=cardHtml(card);
        div.onclick=()=>{
            state.deck.push(card);
            log(`🎴 獲得卡牌：${card.name}`);
            modal.style.display="none";
            
            // 🎵 【音效觸發】選完獎勵卡、關閉彈窗重回地圖時，切換回探索主音樂
            if (typeof AudioManager !== 'undefined') AudioManager.playBGM('menu');
            
            render();
        };
        area.appendChild(div);
    });
    modal.style.display="flex";
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
        if(state.unlockedCardNames.includes(card.name)){
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
                let idxName = state.unlockedCardNames.indexOf(card.name);
                if(idxName !== -1) state.unlockedCardNames.splice(idxName,1);
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
function isCardUnlocked(cardName){ return state.unlockedCardNames.includes(cardName) || state.deck.some(c=>c.name===cardName); }
function getUndrawnCards(){ return drawOnlyCardPool.filter(c=>!isCardUnlocked(c.name)); }
function drawRandomNewCard(){ let available=getUndrawnCards(); if(available.length===0) return null; let idx=Math.floor(Math.random()*available.length); return copyCard(available[idx]); }
function drawSingle(){ if(state.inBattle){ log("戰鬥中無法抽卡"); return; } if(state.gold<100){ log("魂石不足（需要 100）"); return; } let newCard=drawRandomNewCard(); if(!newCard){ log("✨ 你已經解鎖了所有抽卡池的卡牌！無需再抽"); return; } state.gold-=100; if(!state.unlockedCardNames.includes(newCard.name)) state.unlockedCardNames.push(newCard.name); log(`✨ 抽卡獲得全新卡牌：${newCard.name}（${rarityText(newCard.rarity)}），已解鎖購買資格，將出現在商店中，價格 ${newCard.price} 石（可重複購買）`); let resultArea=document.getElementById("drawResultArea"); resultArea.innerHTML=""; let cardDiv=document.createElement("div"); cardDiv.className=`result-card ${newCard.rarity}`; cardDiv.setAttribute("title",getCardTooltip(newCard)); cardDiv.innerHTML=`<div class="energy">${newCard.cost}</div><div style="font-weight:bold; margin-top:8px;">${newCard.name}</div><div class="small">${rarityText(newCard.rarity)}</div><div class="small" style="margin-top:6px;">${newCard.desc}</div><div class="small" style="margin-top:8px;">🛒 商店價格: ${newCard.price}</div>`; resultArea.appendChild(cardDiv); cardDiv.style.animation="cardPop 0.3s cubic-bezier(0.2,0.9,0.4,1.1) forwards"; document.getElementById("drawGold").innerText=state.gold; render(); }
function drawTen(){ if(state.inBattle){ log("戰鬥中無法抽卡"); return; } if(state.gold<980){ log("魂石不足（需要 980）"); return; } let newCards=[]; for(let i=0;i<10;i++){ let card=drawRandomNewCard(); if(!card) break; newCards.push(card); if(!state.unlockedCardNames.includes(card.name)) state.unlockedCardNames.push(card.name); } if(newCards.length===0){ log("✨ 你已經解鎖了所有抽卡池的卡牌！無需再抽"); return; } state.gold-=980; log(`🌟 十連抽！獲得 ${newCards.length} 張全新卡牌：${newCards.map(c=>c.name).join(", ")}，已解鎖購買資格，將出現在商店中（可重複購買）`); let resultArea=document.getElementById("drawResultArea"); resultArea.innerHTML=""; newCards.forEach((card,idx)=>{ let cardDiv=document.createElement("div"); cardDiv.className=`result-card ${card.rarity}`; cardDiv.setAttribute("title",getCardTooltip(card)); cardDiv.innerHTML=`<div class="energy">${card.cost}</div><div style="font-weight:bold; margin-top:8px;">${card.name}</div><div class="small">${rarityText(card.rarity)}</div><div class="small" style="margin-top:6px;">${card.desc}</div><div class="small" style="margin-top:8px;">🛒 商店價格: ${card.price}</div>`; cardDiv.style.animation=`cardPop 0.25s ease-out ${idx*0.05}s forwards`; cardDiv.style.opacity="0"; resultArea.appendChild(cardDiv); }); document.getElementById("drawGold").innerText=state.gold; render(); }
function openDrawModal(){ if(state.inBattle){ log("戰鬥中無法抽卡"); return; } document.getElementById("drawGold").innerText=state.gold; document.getElementById("drawResultArea").innerHTML=""; document.getElementById("drawModal").style.display="flex"; }
function closeDrawModal(){ document.getElementById("drawModal").style.display="none"; }
function openCollectionModal(){ let container=document.getElementById("collectionGrid"); container.innerHTML=""; for(let card of drawOnlyCardPool){ let isUnlocked=state.unlockedCardNames.includes(card.name); let div=document.createElement("div"); div.className=`collection-card ${isUnlocked?"":"locked"} ${card.rarity}`; div.innerHTML=`<div class="energy">${card.cost}</div><div class="collection-name">${card.name}</div><div class="collection-rarity">${rarityText(card.rarity)}</div><div class="collection-desc">${isUnlocked?card.desc:"尚未解鎖，請抽卡"}</div>`; container.appendChild(div); } document.getElementById("collectionModal").style.display="flex"; }
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
    let mapHtml=""; state.map.forEach((n,i)=>{ mapHtml+=`<div class="node ${n.done?'done':''}" onclick="enterNode(${i})">${n.type}</div>`; }); document.getElementById("map").innerHTML=mapHtml;
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
        startScreen.classList.add("hidden"); // 淡出並隱藏開始畫面，露出下方的遊戲本體
    }
    
    // 🎵 藉由玩家這次的點擊，完美解鎖瀏覽器限制並播放音樂
    if (typeof AudioManager !== 'undefined' && !AudioManager.bgm) {
        AudioManager.playBGM('menu');
    }
    
    // 在主日誌中印出歡迎語
    logMessage("🌌 虛空之門已開啟，冒險正式開始！", "#2dff7a");
}

// ==========================================
// 核心載入監聽器 (完全保留你原本的所有初始化邏輯)
// ==========================================
window.addEventListener("load", () => { 
    // 1. 初始化大轉盤 Canvas
    wheelCanvas = document.getElementById("wheelCanvas"); 
    if (wheelCanvas) wheelCtx = wheelCanvas.getContext("2d"); 
    const spinBtn = document.getElementById("wheelSpinBtn"); 
    if (spinBtn) spinBtn.onclick = startWheel; 
    
    // 2. 預設初始職業並渲染主遊戲畫面
    setJob("warrior"); 
    render(); 
    
    console.log("遊戲核心載入完畢，極簡開始畫面就緒。");
});
