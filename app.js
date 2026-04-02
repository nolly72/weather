let allCoins = [];
let myChart = null;

window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initNavigation();
    fetchMarketData();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-section');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === `section-${target}`) s.classList.add('active');
            });
        });
    });
}

// РАБОЧИЙ МЕТОД: Прямой запрос к Bybit (не блокируется в РФ)
async function fetchMarketData() {
    const grid = document.getElementById('cryptoGrid');
    try {
        const response = await fetch('https://bybit.com');
        const result = await response.json();
        
        if (result.retCode !== 0) throw new Error('Ошибка биржи');

        // Выбираем популярные пары к USDT
        const topSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'TONUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];
        
        allCoins = result.result.list
            .filter(item => topSymbols.includes(item.symbol))
            .map(item => {
                const symbol = item.symbol.replace('USDT', '');
                return {
                    id: symbol,
                    symbol: symbol,
                    name: symbol,
                    // Иконки берем с надежного гитхаба
                    image: `https://githubusercontent.com{symbol.toLowerCase()}.png`,
                    price: parseFloat(item.lastPrice),
                    change: parseFloat(item.prevPrice24h) ? ((parseFloat(item.lastPrice) - parseFloat(item.prevPrice24h)) / parseFloat(item.prevPrice24h) * 100) : 0,
                    cap: parseFloat(item.volume24h) // Для объема
                };
            });

        renderDashboard();
        renderMarketTable();
        if (allCoins.length > 0) updateChart(allCoins[0]);

    } catch (error) {
        console.error("Ошибка:", error);
        grid.innerHTML = `<div class="loader" style="color: #ef4444;">Ошибка загрузки данных.</div>`;
    }
}

function renderDashboard() {
    const grid = document.getElementById('cryptoGrid');
    if(!grid) return;
    grid.innerHTML = allCoins.map(coin => `
        <div class="coin-card" onclick="selectCoin('${coin.symbol}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <img src="${coin.image}" width="40" height="40" onerror="this.src='https://dicebear.com{coin.symbol}'">
                <span style="color: ${coin.change > 0 ? '#10b981' : '#ef4444'}; font-weight:800;">
                    ${coin.change > 0 ? '▲' : '▼'} ${Math.abs(coin.change).toFixed(2)}%
                </span>
            </div>
            <p style="color:var(--text-grey); font-size:12px; font-weight:700;">${coin.symbol} / USDT</p>
            <h3 style="font-size:22px;">$${coin.price.toLocaleString()}</h3>
        </div>
    `).join('');
}

function renderMarketTable() {
    const tableBody = document.getElementById('marketTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = allCoins.map(coin => `
        <tr>
            <td style="display:flex; align-items:center; gap:12px; padding: 20px;">
                <img src="${coin.image}" width="28" onerror="this.src='https://dicebear.com{coin.symbol}'"> 
                <b>${coin.symbol}</b>
            </td>
            <td>$${coin.price.toLocaleString()}</td>
            <td style="color:${coin.change > 0 ? '#10b981' : '#ef4444'}">${coin.change.toFixed(2)}%</td>
            <td>$${coin.cap.toLocaleString()}</td>
        </tr>
    `).join('');
}

function selectCoin(symbol) {
    const coin = allCoins.find(c => c.symbol === symbol);
    if (coin) {
        document.getElementById('chartTitle').innerText = `${coin.symbol} Trend`;
        updateChart(coin);
    }
}

function updateChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const dataPoints = Array.from({length: 15}, () => coin.price * (0.99 + Math.random() * 0.02));
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map((_, i) => i),
            datasets: [{
                data: dataPoints, borderColor: '#6366f1', borderWidth: 4, tension: 0.4, fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.1)', pointRadius: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}
