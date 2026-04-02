// 1. Инициализация иконок Lucide
lucide.createIcons();

// 2. Функция переключения чата
function toggleChat() {
    document.querySelector('.chat-window').classList.toggle('active');
}

// 3. Получение реальных данных о крипте
async function getCryptoData() {
    const cryptoList = document.getElementById('crypto-list');
    try {
        const response = await fetch('https://coingecko.com');
        const data = await response.json();
        
        cryptoList.innerHTML = '';
        data.forEach(coin => {
            cryptoList.innerHTML += `
                <div class="coin-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <img src="${coin.image}" width="45">
                        <span style="font-weight:800; color:${coin.price_change_percentage_24h > 0 ? '#05cd99' : '#ee5d50'}">
                            ${coin.price_change_percentage_24h.toFixed(1)}%
                        </span>
                    </div>
                    <p style="color:var(--text-grey); font-weight:600; font-size:14px;">${coin.name}</p>
                    <h2 style="margin-top:5px;">$${coin.current_price.toLocaleString()}</h2>
                </div>
            `;
        });
    } catch (e) {
        cryptoList.innerHTML = '<p>Ошибка загрузки данных...</p>';
    }
}

// 4. Отрисовка графика (Chart.js)
const ctx = document.getElementById('marketChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
        datasets: [{
            label: 'BTC Price',
            data: [62000, 62500, 61800, 63000, 63400, 63200],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4, // Делает линию мягкой и округлой
            borderWidth: 4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f0f0f0' } }
        }
    }
});

// 5. Простая логика чата
document.getElementById('sendMsg').addEventListener('click', () => {
    const input = document.getElementById('chatInput');
    const body = document.getElementById('chatBody');
    if(!input.value) return;

    body.innerHTML += `<div class="msg user">${input.value}</div>`;
    
    setTimeout(() => {
        body.innerHTML += `<div class="msg bot">Анализирую данные по запросу "${input.value}"... Прогноз благоприятный.</div>`;
        body.scrollTop = body.scrollHeight;
    }, 1000);
    
    input.value = '';
});

// Старт
getCryptoData();
