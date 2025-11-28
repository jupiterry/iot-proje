// ============================================
// Global Variables
// ============================================
let currentChannel = null;
let refreshInterval = null;

// ============================================
// Theme Management
// ============================================
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ============================================
// API Functions
// ============================================
async function fetchChannels() {
    try {
        const response = await fetch('/channels');
        const channels = await response.json();
        return channels;
    } catch (error) {
        console.error('Channel listesi alınamadı:', error);
        return [];
    }
}

async function fetchChannelData(channelId, results = 100) {
    try {
        // Cache bypass için timestamp ekle (her zaman en son veriyi al)
        const timestamp = new Date().getTime();
        
        // Son veriyi hızlı almak için last.json endpoint'ini kullan
        const [lastResponse, allResponse] = await Promise.all([
            fetch(`/channels/${channelId}/feeds/last.json?_t=${timestamp}`),
            fetch(`/channels/${channelId}/feeds.json?results=${results}&_t=${timestamp}`)
        ]);
        
        const lastData = await lastResponse.json();
        const allData = await allResponse.json();
        
        // Son veriyi feeds array'inin başına ekle (eğer yeni ise)
        if (lastData.feed && Object.keys(lastData.feed).length > 0) {
            const existingIndex = allData.feeds.findIndex(f => f.id === lastData.feed.id);
            if (existingIndex === -1) {
                // Yeni veri varsa başa ekle
                allData.feeds = [lastData.feed, ...allData.feeds];
            } else if (existingIndex > 0) {
                // Eğer listede varsa ama başta değilse, başa taşı
                allData.feeds.splice(existingIndex, 1);
                allData.feeds.unshift(lastData.feed);
            }
        }
        
        return allData;
    } catch (error) {
        console.error('Channel verileri alınamadı:', error);
        return null;
    }
}

async function createNewChannel(formData) {
    try {
        const response = await fetch('/channels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Channel oluşturulamadı');

        const channel = await response.json();
        return channel;
    } catch (error) {
        console.error('Channel oluşturma hatası:', error);
        throw error;
    }
}

// ============================================
// UI Update Functions
// ============================================
async function refreshChannels() {
    const channels = await fetchChannels();
    const select = document.getElementById('channelSelect');

    // Mevcut seçimi kaydet
    const currentValue = select.value;

    // Dropdown'u güncelle
    select.innerHTML = '<option value="">Channel seçin...</option>';

    channels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `${channel.name} (ID: ${channel.id})`;
        select.appendChild(option);
    });

    // Eğer önceden seçili bir channel varsa, tekrar seç
    if (currentValue) {
        select.value = currentValue;
    }

    console.log(`✓ ${channels.length} channel yüklendi`);
}

async function loadChannelData() {
    const channelId = document.getElementById('channelSelect').value;

    if (!channelId) {
        hideChannelData();
        return;
    }

    // Veri yükleme animasyonu eklenebilir
    showLoadingState();

    const data = await fetchChannelData(channelId, 100);

    if (!data) {
        hideChannelData();
        hideLoadingState();
        return;
    }

    currentChannel = data;

    // UI'ı güncelle
    updateChannelInfo(data.channel);
    updateStats(data.feeds);
    updateCharts();

    // Bölümleri göster
    document.getElementById('channelInfo').classList.remove('hidden');
    document.getElementById('statsSection').classList.remove('hidden');
    document.getElementById('chartsSection').classList.remove('hidden');

    hideLoadingState();

    // Auto-refresh başlat (5 saniyede bir - anlık görünüm)
    startAutoRefresh();
}

function updateChannelInfo(channel) {
    document.getElementById('channelName').textContent = channel.name || '-';
    const apiKeyElement = document.getElementById('apiKey');
    if (channel.api_key) {
        apiKeyElement.textContent = channel.api_key;
    } else {
        apiKeyElement.textContent = 'API Key yükleniyor...';
        console.warn('API key bulunamadı, channel objesi:', channel);
    }
}

function updateStats(feeds) {
    if (!feeds || feeds.length === 0) {
        document.getElementById('currentTemp').textContent = '--°C';
        document.getElementById('currentHumidity').textContent = '--%';
        document.getElementById('totalData').textContent = '0';
        document.getElementById('lastUpdate').textContent = 'Veri yok';
        return;
    }

    // Son veri
    const latest = feeds[0];

    // Sıcaklık
    const temp = parseFloat(latest.field1);
    if (!isNaN(temp)) {
        document.getElementById('currentTemp').textContent = temp.toFixed(1) + '°C';
    }

    // Nem
    const humidity = parseFloat(latest.field2);
    if (!isNaN(humidity)) {
        document.getElementById('currentHumidity').textContent = humidity.toFixed(1) + '%';
    }

    // İstatistikler
    const temps = feeds.map(f => parseFloat(f.field1)).filter(v => !isNaN(v));
    const humidities = feeds.map(f => parseFloat(f.field2)).filter(v => !isNaN(v));

    if (temps.length > 0) {
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        document.getElementById('tempRange').textContent =
            `Min/Max: ${minTemp.toFixed(1)}°C / ${maxTemp.toFixed(1)}°C`;
    }

    if (humidities.length > 0) {
        const minHum = Math.min(...humidities);
        const maxHum = Math.max(...humidities);
        document.getElementById('humidityRange').textContent =
            `Min/Max: ${minHum.toFixed(1)}% / ${maxHum.toFixed(1)}%`;
    }

    // Toplam veri
    document.getElementById('totalData').textContent = feeds.length.toLocaleString('tr-TR');

    // Son güncelleme
    const lastUpdate = new Date(latest.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdate) / 1000 / 60);

    let updateText;
    if (diffMinutes < 1) {
        updateText = 'Az önce';
    } else if (diffMinutes < 60) {
        updateText = `${diffMinutes} dakika önce`;
    } else {
        const diffHours = Math.floor(diffMinutes / 60);
        updateText = `${diffHours} saat önce`;
    }

    document.getElementById('lastUpdate').textContent = `Son güncelleme: ${updateText}`;
}

function hideChannelData() {
    document.getElementById('channelInfo').classList.add('hidden');
    document.getElementById('statsSection').classList.add('hidden');
    document.getElementById('chartsSection').classList.add('hidden');
    stopAutoRefresh();
}

function showLoadingState() {
    // Loading state - istatistiklerde güncelleme göstergesi
    const statsCards = document.querySelectorAll('.stat-value');
    statsCards.forEach(card => {
        if (card.textContent !== '--' && card.textContent !== '--°C' && card.textContent !== '--%') {
            card.style.opacity = '0.6';
        }
    });
}

function hideLoadingState() {
    // Loading state kaldır
    const statsCards = document.querySelectorAll('.stat-value');
    statsCards.forEach(card => {
        card.style.opacity = '1';
    });
}

// ============================================
// Auto Refresh
// ============================================
function startAutoRefresh() {
    stopAutoRefresh();

    // 0.5 saniyede bir güncelle (gerçek zamanlı anlık görünüm)
    refreshInterval = setInterval(async () => {
        const channelId = document.getElementById('channelSelect').value;
        if (channelId) {
            // Sessiz güncelleme (console.log kaldırıldı - performans için)
            const data = await fetchChannelData(channelId, 100);
            if (data) {
                currentChannel = data;
                updateStats(data.feeds);
                updateCharts();
            }
        }
    }, 500); // 0.5 saniye (gerçek zamanlı anlık görünüm)
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ============================================
// Modal Functions
// ============================================
function showCreateChannelModal() {
    document.getElementById('createChannelModal').classList.add('active');
}

function closeCreateChannelModal() {
    document.getElementById('createChannelModal').classList.remove('active');
    document.getElementById('createChannelForm').reset();
}

async function createChannel(event) {
    event.preventDefault();

    const form = event.target;
    const formData = {
        name: form.name.value,
        description: form.description.value || '',
        field1_name: form.field1_name.value || 'Field 1',
        field2_name: form.field2_name.value || 'Field 2'
    };

    try {
        const channel = await createNewChannel(formData);

        // Modal'ı kapat
        closeCreateChannelModal();

        // Channel listesini güncelle
        await refreshChannels();

        // Yeni channel'ı seç
        document.getElementById('channelSelect').value = channel.id;
        await loadChannelData();

        // Başarı mesajı
        alert(`✓ Channel oluşturuldu!\n\nAPI Key: ${channel.api_key}\n\nBu API key'i ESP8266 kodunuzda kullanın.`);

    } catch (error) {
        alert('❌ Channel oluşturulamadı. Lütfen tekrar deneyin.');
    }
}

// ============================================
// Utility Functions
// ============================================
function copyApiKey() {
    const apiKey = document.getElementById('apiKey').textContent;

    navigator.clipboard.writeText(apiKey).then(() => {
        // Geçici bildirim göster
        const btn = event.target.closest('.btn-icon');
        const originalHTML = btn.innerHTML;

        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);

        console.log('✓ API Key kopyalandı');
    });
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await refreshChannels();

    console.log('✓ IoT Analytics Dashboard hazır');
});

// Modal dışına tıklayınca kapat
document.getElementById('createChannelModal').addEventListener('click', (e) => {
    if (e.target.id === 'createChannelModal') {
        closeCreateChannelModal();
    }
});
