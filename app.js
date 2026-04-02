// 1. Глобальные переменные
let allCoins = [];
let myChart = null;

window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initNavigation();
    fetchMarketData();
});

// 2. Навигация (Логика переключения разделов)
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === `section-${targetId}`) s.classList.add('active');
            });
            document.getElementById('sidebar').classList.remove('mobile-open');
        });
    });
    const menuBtn = document.getElementById('menuBtn');
    if(menuBtn) menuBtn.onclick = () => document.getElementById('sidebar').classList.toggle('mobile-open');
}

// 3. ПОЛУЧЕНИЕ ДАННЫХ (Binance Public API — работает стабильно в РФ)
async function fetchMarketData() {
    const grid = document.getElementById('cryptoGrid');
    try {
        // Запрашиваем 24-часовую статистику по всем тикерам
        const res = await fetch('https://binance.com');
        const data = await res.json();
        
        // Список популярных монет для отображения
        const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'DOTUSDT', 'DOGEUSDT'];
        
        allCoins = data
            .filter(item => targetSymbols.includes(item.symbol))
            .map(item => {
                const cleanSymbol = item.symbol.replace('USDT', '');
                return {
                    id: cleanSymbol.toLowerCase(),
                    symbol: cleanSymbol,
                    name: cleanSymbol === 'BTC' ? 'Bitcoin' : cleanSymbol === 'ETH' ? 'Ethereum' : cleanSymbol,
                    // Иконки из GitHub репозитория (всегда доступны)
                    image: `https://githubusercontent.com{cleanSymbol.toLowerCase()}.png`,
                    current_price: parseFloat(item.lastPrice),
                    price_change_percentage_24h: parseFloat(item.priceChangePercent),
                    market_cap: parseFloat(item.quoteVolume) // Используем объем как показатель веса
                };
            });

        renderDashboard(allCoins);
        renderMarketTable(allCoins);
        if (allCoins.length > 0) updateChart(allCoins);

    } catch (error) {
        console.error("Market Data Error:", error);
        grid.innerHTML = "<div class='loader'>Ошибка соединения. Попробуйте позже.</div>";
    }
}

// 4. Отрисовка карточек (Обзор)
function renderDashboard(data) {
    const grid = document.getElementById('cryptoGrid');
    grid.innerHTML = data.slice(0, 8).map(coin => `
        <div class="coin-card" onclick="selectCoin('${coin.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <img src="${coin.image}" width="40" height="40" onerror="this.src='https://dicebear.com{coin.symbol}'">
                <span style="color: ${coin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444'}; font-weight:800;">
                    ${coin.price_change_percentage_24h.toFixed(2)}%
                </span>
            </div>
            <p style="color:var(--text-grey); font-size:12px; font-weight:700;">${coin.symbol}</p>
            <h3 style="font-size:20px;">$${coin.current_price.toLocaleString(undefined, {maximumFractionDigits: 2})}</h3>
        </div>
    `).join('');
}

// 5. Выбор монеты и график (Генерация визуального тренда)
function selectCoin(id) {
    const coin = allCoins.find(c => c.id === id);
    if(coin) {
        document.getElementById('chartTitle').innerText = `${coin.name} (USD)`;
        updateChart(coin);
        showAiMessage(`Nolly: ${coin.name} торгуется по цене $${coin.current_price.toLocaleString()}. За сутки волатильность составила ${coin.price_change_percentage_24h.toFixed(2)}%.`);
    }
}

function updateChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const points = Array.from({length: 20}, () => coin.current_price * (0.98 + Math.random() * 0.04));
    const labels = points.map((_, i) => i);
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: points, borderColor: '#6366f1', borderWidth: 3, tension: 0.4, fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.05)', pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { grid: { color: '#f1f5f9' } } }
        }
    });
}

// 6. ИИ и Утилиты (Остаются как были)
function toggleAi() { document.getElementById('aiChatWindow').classList.toggle('active'); }
function showAiMessage(t) {
    const b = document.getElementById('aiMessages');
    const d = document.createElement('div');
    d.className = 'msg bot'; d.innerText = t;
    b.appendChild(d); b.scrollTop = b.scrollHeight;
}

document.getElementById('aiSendBtn').onclick = () => {
    const input = document.getElementById('aiInput');
    if(!input.value) return;
    const box = document.getElementById('aiMessages');
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user'; userDiv.innerText = input.value;
    box.appendChild(userDiv);
    const userVal = input.value;
    input.value = '';
    setTimeout(() => {
        showAiMessage(`Анализирую "${userVal}"... Согласно данным Binance, рынок сейчас в активной фазе.`);
    }, 800);
};

// 7. Поиск
document.getElementById('coinSearch').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    renderDashboard(allCoins.filter(c => c.name.toLowerCase().includes(val) || c.symbol.toLowerCase().includes(val)));
});
