// 1. КОНФИГУРАЦИЯ С ТВОИМ КЛЮЧОМ
const API_KEY = 'a95a50822aa917e66ee9b03c4351e50baa42b187088c945539777a0685e5e5e5e'; // Твой ключ NollyApp
let allCoins = [];
let myChart = null;

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initNavigation();
    fetchMarketData();
});

// 2. НАВИГАЦИЯ (Переключение разделов)
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
            // Закрытие мобильного меню
            document.getElementById('sidebar').classList.remove('mobile-open');
        });
    });
    
    const menuBtn = document.getElementById('menuBtn');
    if(menuBtn) menuBtn.onclick = () => document.getElementById('sidebar').classList.toggle('mobile-open');
}

// 3. ПОЛУЧЕНИЕ ДАННЫХ (CryptoCompare API)
async function fetchMarketData() {
    const grid = document.getElementById('cryptoGrid');
    try {
        // Запрос ТОП-20 монет по капитализации
        const response = await fetch(`https://cryptocompare.com{API_KEY}`);
        const result = await response.json();

        if (result.Response === "Error") throw new Error(result.Message);

        // Маппинг данных в наш формат
        allCoins = result.Data.map(item => ({
            id: item.CoinInfo.Name,
            symbol: item.CoinInfo.Name,
            name: item.CoinInfo.FullName,
            image: `https://cryptocompare.com${item.CoinInfo.ImageUrl}`,
            price: item.RAW?.USD.PRICE || 0,
            change: item.RAW?.USD.CHANGEPCT24HOUR || 0,
            cap: item.RAW?.USD.MKTCAP || 0
        }));

        renderDashboard();
        renderMarketTable();
        
        // Рисуем график для первой монеты (обычно BTC)
        if (allCoins.length > 0) updateChart(allCoins[0]);

    } catch (error) {
        console.error("Критическая ошибка API:", error);
        grid.innerHTML = `<div class="loader" style="color: #ef4444;">Ошибка: ${error.message}</div>`;
    }
}

// 4. ОТРИСОВКА КАРТОЧЕК (Раздел Обзор)
function renderDashboard() {
    const grid = document.getElementById('cryptoGrid');
    if(!grid) return;
    
    grid.innerHTML = allCoins.slice(0, 8).map(coin => `
        <div class="coin-card" onclick="selectCoin('${coin.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <img src="${coin.image}" width="40" height="40" style="border-radius:50%">
                <span style="color: ${coin.change > 0 ? '#10b981' : '#ef4444'}; font-weight:800; font-size:14px;">
                    ${coin.change > 0 ? '▲' : '▼'} ${Math.abs(coin.change).toFixed(2)}%
                </span>
            </div>
            <p style="color:var(--text-grey); font-size:12px; font-weight:700;">${coin.symbol} / USD</p>
            <h3 style="font-size:22px; margin-top:5px;">$${coin.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
    `).join('');
}

// 5. ТАБЛИЦА РЫНКА (Раздел Рынок)
function renderMarketTable() {
    const tableBody = document.getElementById('marketTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = allCoins.map(coin => `
        <tr>
            <td style="display:flex; align-items:center; gap:12px; padding: 20px;">
                <img src="${coin.image}" width="28" style="border-radius:50%"> 
                <div>
                    <div style="font-weight:800;">${coin.symbol}</div>
                    <div style="font-size:12px; color:var(--text-grey);">${coin.name}</div>
                </div>
            </td>
            <td style="font-weight:700;">$${coin.price.toLocaleString()}</td>
            <td style="color: ${coin.change > 0 ? '#10b981' : '#ef4444'}; font-weight:800;">
                ${coin.change.toFixed(2)}%
            </td>
            <td style="color: var(--text-grey);">$${(coin.cap / 1e9).toFixed(2)}B</td>
        </tr>
    `).join('');
}

// 6. ГРАФИК И ВЫБОР МОНЕТЫ
function selectCoin(symbol) {
    const coin = allCoins.find(c => c.symbol === symbol);
    if (coin) {
        document.getElementById('chartTitle').innerText = `${coin.name} Trend (USD)`;
        updateChart(coin);
        
        // Ответ ИИ
        showAiMessage(`Nolly: Анализирую ${coin.name}. Текущая рыночная цена $${coin.price.toLocaleString()}. Изменение за 24ч: ${coin.change.toFixed(2)}%.`);
    }
}

function updateChart(coin) {
    const canvas = document.getElementById('mainChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Имитация данных для графика (бесплатный API CryptoCompare дает историю отдельным запросом)
    const dataPoints = Array.from({length: 15}, () => coin.price * (0.98 + Math.random() * 0.04));
    
    if (myChart) myChart.destroy();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map((_, i) => i),
            datasets: [{
                data: dataPoints,
                borderColor: '#6366f1',
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                backgroundColor: gradient,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                x: { display: false }, 
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { weight: '600' } } } 
            }
        }
    });
}

// 7. ИИ АССИСТЕНТ
function toggleAi() {
    document.getElementById('aiChatWindow').classList.toggle('active');
}

function showAiMessage(text) {
    const chat = document.getElementById('aiMessages');
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

document.getElementById('aiSendBtn').onclick = () => {
    const input = document.getElementById('aiInput');
    if (!input.value.trim()) return;
    
    const chat = document.getElementById('aiMessages');
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user';
    userDiv.innerText = input.value;
    chat.appendChild(userDiv);
    
    const text = input.value;
    input.value = '';
    
    setTimeout(() => {
        showAiMessage(`Nolly: Хмм, твой запрос про "${text}" заставил меня задуматься. На рынке сейчас высокая волатильность, будь осторожен!`);
    }, 1000);
};

// 8. ПОИСК
document.getElementById('coinSearch').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allCoins.filter(c => c.name.toLowerCase().includes(val) || c.symbol.toLowerCase().includes(val));
    renderDashboard(filtered);
});
