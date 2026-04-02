// 1. Глобальные переменные
let allCoins = [];
let myChart = null;
let favorites = JSON.parse(localStorage.getItem('nolly_favs')) || [];

// Ждем загрузки библиотек и DOM
window.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initNavigation();
    fetchMarketData();
});

// 2. Навигация между разделами
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');

            // Переключаем активный класс у ссылок
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Переключаем видимость секций
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `section-${targetId}`) {
                    section.classList.add('active');
                }
            });

            // Закрываем мобильное меню при клике
            document.getElementById('sidebar').classList.remove('mobile-open');
        });
    });

    // Бургер-меню
    const menuBtn = document.getElementById('menuBtn');
    if(menuBtn) {
        menuBtn.onclick = () => document.getElementById('sidebar').classList.toggle('mobile-open');
    }
}

// 3. Получение данных с CoinGecko
async function fetchMarketData() {
    try {
        const response = await fetch('https://coingecko.com');
        allCoins = await response.json();
        
        renderDashboard(allCoins);
        renderMarketTable(allCoins);
        
        // Рисуем начальный график (Bitcoin)
        if (allCoins.length > 0) updateChart(allCoins[0]);
    } catch (error) {
        console.error("API Error:", error);
        document.getElementById('cryptoGrid').innerHTML = "<p class='loader'>Ошибка сети. Попробуйте VPN.</p>";
    }
}

// 4. Отрисовка карточек (Обзор)
function renderDashboard(data) {
    const grid = document.getElementById('cryptoGrid');
    grid.innerHTML = data.slice(0, 8).map(coin => `
        <div class="coin-card" onclick="selectCoin('${coin.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <img src="${coin.image}" width="40" height="40">
                <span style="color: ${coin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444'}; font-weight:800;">
                    ${coin.price_change_percentage_24h?.toFixed(2)}%
                </span>
            </div>
            <p style="color:var(--text-grey); font-size:12px; font-weight:700;">${coin.symbol.toUpperCase()}</p>
            <h3 style="font-size:20px;">$${coin.current_price.toLocaleString()}</h3>
        </div>
    `).join('');
}

// 5. Таблица (Раздел Рынок)
function renderMarketTable(data) {
    const tableBody = document.getElementById('marketTableBody');
    if(!tableBody) return;
    tableBody.innerHTML = data.map(coin => `
        <tr>
            <td style="display:flex; align-items:center; gap:10px;">
                <img src="${coin.image}" width="24"> ${coin.name}
            </td>
            <td>$${coin.current_price.toLocaleString()}</td>
            <td style="color: ${coin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444'}">
                ${coin.price_change_percentage_24h?.toFixed(2)}%
            </td>
            <td>$${(coin.market_cap / 1e9).toFixed(2)}B</td>
        </tr>
    `).join('');
}

// 6. Обновление графика
function selectCoin(id) {
    const coin = allCoins.find(c => c.id === id);
    if(coin) {
        document.getElementById('chartTitle').innerText = `${coin.name} Trend`;
        updateChart(coin);
        // Сообщение от ИИ
        const msg = `Nolly проанализировал ${coin.name}. Текущая цена $${coin.current_price}. Тренд ${coin.price_change_percentage_24h > 0 ? 'положительный' : 'негативный'}.`;
        showAiMessage(msg);
    }
}

function updateChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const prices = coin.sparkline_in_7d.price;
    const labels = prices.map((_, i) => i);

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: prices,
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { grid: { color: '#f1f5f9' } } }
        }
    });
}

// 7. ИИ Логика
function toggleAi() {
    document.getElementById('aiChatWindow').classList.toggle('active');
}

function showAiMessage(text) {
    const box = document.getElementById('aiMessages');
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

document.getElementById('aiSendBtn').onclick = () => {
    const input = document.getElementById('aiInput');
    if(!input.value) return;
    
    const box = document.getElementById('aiMessages');
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user';
    userDiv.innerText = input.value;
    box.appendChild(userDiv);
    
    const userVal = input.value;
    input.value = '';

    setTimeout(() => {
        showAiMessage(`Я изучил твой запрос про "${userVal}". Мой совет: всегда проверяй RSI перед сделкой!`);
    }, 1000);
};

// 8. Поиск
document.getElementById('coinSearch').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allCoins.filter(c => c.name.toLowerCase().includes(val));
    renderDashboard(filtered);
});
