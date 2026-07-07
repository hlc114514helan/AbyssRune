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
<div class="stat">☠️ 中毒：<span id="poison"></span></div>
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
