// ============================================================
// 虛擬股市 · 完整邏輯（遊戲二）
// 魂石與遊戲一同步 · 支援主動波動與背景同步
// ============================================================

// ============================================================
// 1. 從 localStorage 讀取魂石
// ============================================================
function loadSoulStonesFromGame1() {
    try {
        const raw = localStorage.getItem('abyss_rune_final');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && typeof data.gold === 'number') {
                return Math.floor(data.gold);
            }
        }
    } catch (e) {
        console.warn('讀取魂石失敗', e);
    }
    return 1000;
}

function saveSoulStonesToGame1(amount) {
    try {
        const raw = localStorage.getItem('abyss_rune_final');
        if (raw) {
            const data = JSON.parse(raw);
            data.gold = Math.floor(amount);
            localStorage.setItem('abyss_rune_final', JSON.stringify(data));
            console.log('✅ 魂石已同步保存到遊戲一：', amount);
        } else {
            const newData = {
                gold: Math.floor(amount),
                hp: 80,
                maxHp: 80,
                energy: 3,
                maxEnergy: 3,
                block: 0,
                floor: 1,
                job: 'warrior',
                strength: 0,
                poison: 0,
                deck: [],
                hand: [],
                discard: [],
                map: [],
                relics: [],
                inBattle: false,
                usedOnceCards: [],
                unlockedCardNames: [],
                ownedCardNames: [],
                shopDiscount: 1,
                evolutionPoints: 0,
                evolved: false,
                permanentStrength: 0,
                gameStarted: false,
                firstTurnBonusEnergy: 0,
                firstTurnOfBattle: true,
                rangerFirstAttackFree: false,
                vampireHealRatio: 0.4,
                tempStrength: 0,
                extraDrawUsed: false,
                critBonusMult: 1.5,
                vampireHealBonus: 0,
                drawReduce: 0,
                curseDamage: 0,
                equipmentUnlocked: false,
                equipment: { weapon: null, armor: null, pants: null, boots: null },
                blackMarketCards: null,
                shopCards: null
            };
            localStorage.setItem('abyss_rune_final', JSON.stringify(newData));
            console.log('✅ 已建立新存檔，魂石：', amount);
        }
    } catch (e) {
        console.warn('保存魂石失敗', e);
    }
}

// ============================================================
// 2. 儲存／讀取 持股資料
// ============================================================
function saveHoldingsData() {
    try {
        const data = {
            holdings: holdings,
            timestamp: Date.now()
        };
        localStorage.setItem('stock_holdings_data', JSON.stringify(data));
        console.log('✅ 持股資料已儲存');
    } catch (e) {
        console.warn('儲存持股失敗', e);
    }
}

function loadHoldingsData() {
    try {
        const raw = localStorage.getItem('stock_holdings_data');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.holdings) {
                holdings = data.holdings;
                console.log('✅ 持股資料已讀取', holdings);
                return true;
            }
        }
    } catch (e) {
        console.warn('讀取持股失敗', e);
    }
    return false;
}

// 儲存最新的股市狀態供跨頁面共用
function saveStockMarketData() {
    try {
        const data = {
            stocks: stocks,
            timestamp: Date.now()
        };
        localStorage.setItem('stock_market_data', JSON.stringify(data));
    } catch (e) {
        console.warn('儲存股市數據失敗', e);
    }
}

// ============================================================
// 3. 從 localStorage 讀取共用股市數據
// ============================================================
function loadStockMarketData() {
    try {
        const raw = localStorage.getItem('stock_market_data');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.stocks && data.stocks.length > 0) {
                return data.stocks;
            }
        }
    } catch (e) {
        console.warn('讀取股市數據失敗', e);
    }
    return [
        { id: 'TECH', name: '未來科技', code: 'FT.01', price: 128.50, history: [] },
        { id: 'HEAL', name: '健康醫藥', code: 'HM.02', price: 86.20, history: [] },
        { id: 'ENER', name: '能源集團', code: 'EG.03', price: 215.80, history: [] },
        { id: 'AI', name: 'AI晶片', code: 'AI.04', price: 342.60, history: [] },
        { id: 'RETA', name: '消費零售', code: 'CR.05', price: 57.30, history: [] }
    ];
}

// ============================================================
// 4. 狀態與全域變數
// ============================================================
let cash = loadSoulStonesFromGame1();
let holdings = {};
let stocks = [];
let logEntries = [];
let syncCheckTimer = null;

// ============================================================
// 5. DOM 參考
// ============================================================
const cashDisplay = document.getElementById('cashDisplay');
const marketValueEl = document.getElementById('marketValue');
const totalAssetsEl = document.getElementById('totalAssets');
const totalPnLEl = document.getElementById('totalPnL');
const stockListEl = document.getElementById('stockList');
const logEntriesEl = document.getElementById('logEntries');
const holdingsListEl = document.getElementById('holdingsList');
const toastEl = document.getElementById('toast');

// ============================================================
// 6. 工具函式
// ============================================================
function formatMoney(v) {
    return Math.floor(v).toLocaleString();
}

let toastTimeout = null;

function showToast(msg, type = 'success') {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast ' + type;
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2200);
}

// ============================================================
// 7. 交易核心
// ============================================================
function buyStock(stockId) {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) {
        showToast('❌ 找不到該股票', 'error');
        return;
    }
    const price = Math.floor(stock.price);
    const input = document.getElementById('qty_' + stockId);
    if (!input) return;
    let qty = parseInt(input.value);
    if (isNaN(qty) || qty < 1) {
        showToast('❌ 請輸入有效的正整數', 'error');
        return;
    }
    const cost = price * qty;
    if (cash < cost) {
        showToast('❌ 魂石不足！需要 ' + formatMoney(cost) + ' 魂石', 'error');
        return;
    }
    cash -= cost;
    if (!holdings[stockId]) {
        holdings[stockId] = { qty: 0, cost: 0 };
    }
    const h = holdings[stockId];
    h.cost += cost;
    h.qty += qty;
    addLog(`🟢 買入 ${stock.name} ${qty}股 @ ${price} 魂石/股`, 'buy');
    showToast(`✅ 買入 ${stock.name} ${qty}股 成功`, 'success');
    saveSoulStonesToGame1(cash);
    saveHoldingsData();
    renderAll();
}

function sellStock(stockId) {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) {
        showToast('❌ 找不到該股票', 'error');
        return;
    }
    const h = holdings[stockId];
    if (!h || h.qty <= 0) {
        showToast('❌ 你沒有持有這支股票', 'error');
        return;
    }
    const input = document.getElementById('qty_' + stockId);
    if (!input) return;
    let qty = parseInt(input.value);
    if (isNaN(qty) || qty < 1) {
        showToast('❌ 請輸入有效的正整數', 'error');
        return;
    }
    if (qty > h.qty) {
        showToast(`❌ 你只有 ${h.qty} 股，無法賣出 ${qty} 股`, 'error');
        return;
    }
    const price = Math.floor(stock.price);
    const revenue = price * qty;
    cash += revenue;
    const costPerShare = h.cost / h.qty;
    const costToDeduct = costPerShare * qty;
    h.cost -= costToDeduct;
    h.qty -= qty;
    if (h.qty === 0) {
        delete holdings[stockId];
    }
    addLog(`🔴 賣出 ${stock.name} ${qty}股 @ ${price} 魂石/股`, 'sell');
    showToast(`✅ 賣出 ${stock.name} ${qty}股 成功`, 'success');
    saveSoulStonesToGame1(cash);
    saveHoldingsData();
    renderAll();
}

function addLog(msg, type = 'info') {
    logEntries.unshift({ msg, type, time: new Date().toLocaleTimeString() });
    if (logEntries.length > 50) logEntries.pop();
}

// ============================================================
// 8. 股價自動波動邏輯 (解決不動問題)
// ============================================================
function updateStockPricesLocally() {
    if (!stocks || stocks.length === 0) return;

    stocks.forEach(stock => {
        // -4% 到 +4.5% 之間隨機波動
        const rate = (Math.random() * 0.085) - 0.04;
        let newPrice = stock.price * (1 + rate);
        newPrice = Math.max(1, Math.round(newPrice * 100) / 100);

        stock.price = newPrice;
        if (!stock.history) stock.history = [];
        stock.history.push(newPrice);
        if (stock.history.length > 20) stock.history.shift();

        // 隨機成交量更新
        stock.volume = (stock.volume || 1000) + Math.floor((Math.random() - 0.4) * 200);
        stock.volume = Math.max(100, stock.volume);
    });

    saveStockMarketData();
    renderAll();
}

// ============================================================
// 9. 渲染 UI
// ============================================================
function renderAll() {
    let totalMarketValue = 0;
    stocks.forEach(s => {
        const h = holdings[s.id];
        if (h && h.qty > 0) {
            totalMarketValue += Math.floor(h.qty * s.price);
        }
    });
    const totalAssets = cash + totalMarketValue;
    const initialTotal = loadSoulStonesFromGame1();
    const totalPnL = totalAssets - initialTotal;

    if (cashDisplay) cashDisplay.textContent = formatMoney(cash);
    if (marketValueEl) marketValueEl.textContent = formatMoney(totalMarketValue);
    if (totalAssetsEl) totalAssetsEl.textContent = formatMoney(totalAssets);
    if (totalPnLEl) {
        totalPnLEl.textContent = (totalPnL >= 0 ? '+' : '') + formatMoney(totalPnL);
        totalPnLEl.style.color = totalPnL >= 0 ? '#facc15' : '#ff6b6b';
    }

    let html = '';
    stocks.forEach(stock => {
        const h = holdings[stock.id];
        const qty = h ? h.qty : 0;
        const cost = h ? h.cost : 0;
        const avgCost = qty > 0 ? cost / qty : 0;
        const currentPrice = Math.floor(stock.price);
        const pnl = qty > 0 ? (currentPrice - avgCost) * qty : 0;
        const pnlPercent = qty > 0 && avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

        let changePercent = 0;
        if (stock.history && stock.history.length >= 2) {
            const prev = stock.history[stock.history.length - 2];
            if (prev > 0) {
                changePercent = ((stock.price - prev) / prev) * 100;
            }
        }
        const changeStr = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
        const changeClass = changePercent >= 0 ? 'up' : 'down';

        const canvasId = 'chart_' + stock.id;

        html += `
            <div class="stock-row">
                <div class="stock-name">${stock.name} <span class="stock-code">${stock.code}</span> <span style="font-size:11px; color:#8a7a6a; margin-left:6px;">📊 ${(stock.volume || 0).toLocaleString()}張</span></div>
                <div class="stock-price">${currentPrice} 石</div>
                <div class="stock-change ${changeClass}">${changeStr}</div>
                <div class="stock-holdings">${qty} 股</div>
                <div class="stock-cost">${qty > 0 ? Math.floor(avgCost) + ' 石' : '--'}</div>
                <div class="stock-pnl ${pnl >= 0 ? 'up' : 'down'}">
                    ${qty > 0 ? (pnl >= 0 ? '+' : '') + Math.floor(pnl) + ' (' + (pnlPercent >= 0 ? '+' : '') + pnlPercent.toFixed(2) + '%)' : '--'}
                </div>
                <div class="stock-actions">
                    <input type="number" id="qty_${stock.id}" value="1" min="1" step="1">
                    <button class="btn-buy" onclick="buyStock('${stock.id}')" ${cash < Math.floor(stock.price) ? 'disabled' : ''}>買入</button>
                    <button class="btn-sell" onclick="sellStock('${stock.id}')" ${qty <= 0 ? 'disabled' : ''}>賣出</button>
                </div>
                <div>
                    <canvas id="${canvasId}" width="80" height="30" class="mini-chart"></canvas>
                </div>
            </div>
        `;
    });
    if (stockListEl) stockListEl.innerHTML = html;

    // 繪製迷你折線圖
    stocks.forEach(stock => {
        const canvas = document.getElementById('chart_' + stock.id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const data = stock.history ? stock.history.slice(-20) : [];
        if (data.length < 2) {
            ctx.clearRect(0, 0, 80, 30);
            ctx.fillStyle = '#6a5a4a';
            ctx.font = '10px sans-serif';
            ctx.fillText('--', 30, 20);
            return;
        }
        const min = Math.min(...data) * 0.98;
        const max = Math.max(...data) * 1.02;
        const range = max - min || 1;
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.strokeStyle = data[data.length - 1] >= data[0] ? '#facc15' : '#ff6b6b';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((data[i] - min) / range) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });

    // 渲染交易日誌
    if (logEntriesEl) {
        if (logEntries.length === 0) {
            logEntriesEl.innerHTML = `<div class="log-entry" style="color:#6a5a4a;">暫無交易</div>`;
        } else {
            let logHtml = '';
            logEntries.slice(0, 15).forEach(entry => {
                const cls = entry.type === 'buy' ? 'highlight-buy' : entry.type === 'sell' ? 'highlight-sell' : '';
                logHtml += `<div class="log-entry"><span class="${cls}">[${entry.time}]</span> ${entry.msg}</div>`;
            });
            logEntriesEl.innerHTML = logHtml;
        }
    }

    // 渲染持股列表
    if (holdingsListEl) {
        const keys = Object.keys(holdings);
        if (keys.length === 0) {
            holdingsListEl.innerHTML = `<div class="empty-hint">尚未持有股票</div>`;
        } else {
            let hHtml = '';
            keys.forEach(id => {
                const stock = stocks.find(s => s.id === id);
                if (!stock) return;
                const h = holdings[id];
                const avgCost = h.cost / h.qty;
                const value = Math.floor(h.qty * stock.price);
                const pnl = (Math.floor(stock.price) - avgCost) * h.qty;
                hHtml += `
                    <div class="h-item">
                        <span>${stock.name}</span>
                        <span class="h-val">${h.qty}股 成本${Math.floor(avgCost)}石 市值${formatMoney(value)}石 ${pnl >= 0 ? '📈' : '📉'}</span>
                    </div>
                `;
            });
            holdingsListEl.innerHTML = hHtml;
        }
    }
}

// ============================================================
// 10. 數據同步與自動刷新計時器 (3秒自動更新)
// ============================================================
function startDataSyncCheck() {
    if (syncCheckTimer) clearInterval(syncCheckTimer);
    let lastData = localStorage.getItem('stock_market_data') || '';

    syncCheckTimer = setInterval(() => {
        const currentData = localStorage.getItem('stock_market_data') || '';
        if (currentData !== lastData) {
            // 被動監聽：如果遊戲一有更新，讀取遊戲一的數據
            lastData = currentData;
            try {
                const raw = localStorage.getItem('stock_market_data');
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data && data.stocks) {
                        stocks = data.stocks;
                        renderAll();
                    }
                }
            } catch (e) {}
        } else {
            // 主動更新：若遊戲一沒有傳遞新數據，由遊戲二自己產生價格波動
            updateStockPricesLocally();
            lastData = localStorage.getItem('stock_market_data') || '';
        }
    }, 30000);
}

// ============================================================
// 11. 返回主遊戲
// ============================================================
function goBack() {
    if (syncCheckTimer) {
        clearInterval(syncCheckTimer);
        syncCheckTimer = null;
    }
    saveSoulStonesToGame1(cash);
    saveHoldingsData();
    saveStockMarketData();
    window.location.href = 'index.html?autoload=true';
}

// ============================================================
// 12. 初始化
// ============================================================
function init() {
    cash = loadSoulStonesFromGame1();
    loadHoldingsData();
    const stockData = loadStockMarketData();
    stocks = stockData.map(s => ({
        ...s,
        history: s.history && s.history.length > 0 ? s.history : [s.price],
        volume: s.volume || (500 + Math.floor(Math.random() * 5000))
    }));

    stocks.forEach(s => {
        if (!s.history || s.history.length === 0) {
            s.history = [s.price];
        }
        while (s.history.length < 20) {
            s.history.push(s.price);
        }
    });

    logEntries = [];
    addLog(`🎯 歡迎來到深淵股市！當前魂石：${formatMoney(cash)} 石`, 'info');
    renderAll();
    startDataSyncCheck();
}

// 頁面關閉時自動存檔
window.addEventListener('beforeunload', function() {
    if (syncCheckTimer) clearInterval(syncCheckTimer);
    saveSoulStonesToGame1(cash);
    saveHoldingsData();
    saveStockMarketData();
});

// 開始執行！
init();