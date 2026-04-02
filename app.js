// 1. Инициализация иконок
lucide.createIcons();

let allCoins = []; // Хранилище для всех монет
let myChart = null; // Объект графика
let favorites = JSON.parse(localStorage.getItem('nolly_favs')) || [];

// 2. Мобильное меню (Sidebar)
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');

if(menuBtn) {
    menuBtn.onclick = () => {
        sidebar.classList.toggle('mobile-open');
    };
}

// Закрытие меню при клике на ссылку (для мобилок)
document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = () => sidebar.classList.remove('mobile-open');
});

// 3. Работа с ИИ Виджетом
function toggleAi() {
    const chat = document.getElementById('aiChatWindow');
    chat.classList.toggle('active');
}

// 4. Получение данных о рынке (CoinGecko API)
async function fetchMarketData() {
    const grid = document.getElementById('cryptoGrid');
    try {
        // Запрашиваем топ-15 монет с данными для графиков (sparkline)
        const response = await fetch('https://coingecko.com');
        allCoins = await response.json();
        
        renderCoins(allCoins);
        
        // По умолчанию рисуем график первой монеты (обычно BTC)
        if(!myChart && allCoins.length > 0) {
            updateChart(allCoins[0]);
        }
    } catch (error) {
        grid.innerHTML = `<div class="error">Ошибка загрузки данных. Проверьте соединение.</div>`;
    }
}

// 5. Отрисовка карточек монет
function renderCoins(data) {
    const grid = document.getElementById('cryptoGrid');
    grid.innerHTML = data.map(coin => {
        const isFav = favorites.includes(coin.id) ? 'active' : '';
        const priceChange = coin.price_change_percentage_24h || 0;
        
        return `
            <div class="coin-card" onclick="selectCoin('${coin.id}')" id="card-${coin.id}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <img src="${coin.image}" width="42" height="42" alt="${coin.name}">
                    <span style="color: ${priceChange > 0 ? '#10b981' : '#ef4444'}; font-weight: 800; font-size: 14px;">
                        ${priceChange > 0 ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)}%
                    </span>
                </div>
                <p style="color: var(--text-grey); font-size: 13px; font-weight: 600;">${coin.symbol.toUpperCase()} / USD</p>
                <h3 style="font-size: 22px; margin-top: 5px;">$${coin.current_price.toLocaleString()}</h3>
            </div>
        `;
    }).join('');
}

// 6. Выбор монеты и обновление аналитики
function selectCoin(coinId) {
    const coin = allCoins.find(c => c.id === coinId);
    if(!coin) return;

    // Подсветка активной карточки
    document.querySelectorAll('.coin-card').forEach(c => c.classList.remove('active-coin'));
    document.getElementById(`card-${coinId}`).classList.add('active-coin');

    // Обновляем заголовок и график
    document.getElementById('chartTitle').innerText = `${coin.name} (USD) — 7 дней`;
    updateChart(coin);

    // Логика ИИ ответа
    sendAiMessage(coin);
}

// 7. Обновление графика (Chart.js)
function updateChart(coin) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const prices = coin.sparkline_in_7d.price;
    const labels = prices.map((_, index) => index);

    if (myChart) {
        myChart.destroy(); // Удаляем старый график перед созданием нового
    }

    // Создаем градиент для заливки под линией
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Цена',
                data: prices,
                borderColor: '#6366f1',
                borderWidth: 4,
                tension: 0.4, // Мягкая округлая линия
                fill: true,
                backgroundColor: gradient,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1b2559',
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false
                }
            },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: '#f1f5f9', drawBorder: false },
                    ticks: { color: '#a3aed0', font: { family: 'Manrope', weight: '600' } }
                }
            }
        }
    });
}

// 8. ИИ Логика (Анализ монеты)
function sendAiMessage(coin) {
    const messages = document.getElementById('aiMessages');
    const trend = coin.price_change_percentage_24h > 0 ? "положительную" : "отрицательную";
    
    const botMsg = document.createElement('div');
    botMsg.className = 'msg bot';
    botMsg.innerHTML = `<b>Анализ ${coin.name}:</b> Сейчас мы видим ${trend} динамику. Технически монета находится в фазе ${coin.price_change_percentage_24h > 2 ? 'активного роста' : 'ожидания'}. Следите за уровнем $${(coin.current_price * 1.05).toFixed(2)}.`;
    
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
}

// Чат с пользователем
document.getElementById('aiSendBtn').onclick = () => {
    const input = document.getElementById('aiInput');
    const messages = document.getElementById('aiMessages');
    if(!input.value.trim()) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.innerText = input.value;
    messages.appendChild(userMsg);

    const val = input.value.toLowerCase();
    input.value = '';

    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';
        botMsg.innerText = `Nolly проанализировал ваш запрос "${val}". Я рекомендую следить за волатильностью и не забывать про стоп-лоссы!`;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
};

// 9. Поиск
document.getElementById('coinSearch').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allCoins.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.symbol.toLowerCase().includes(query)
    );
    renderCoins(filtered);
});

// Запуск приложения
fetchMarketData();
// Обновляем данные каждую минуту
setInterval(fetchMarketData, 60000);
