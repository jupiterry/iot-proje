// ============================================
// Chart.js Configuration & Management
// ============================================

let temperatureChart = null;
let humidityChart = null;

// Chart.js default ayarları
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');

// ============================================
// Chart Creation
// ============================================
function createTemperatureChart(labels, data) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');

    // Eski chart'ı yok et
    if (temperatureChart) {
        temperatureChart.destroy();
    }

    // Gradient oluştur
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(245, 94, 108, 0.5)');
    gradient.addColorStop(1, 'rgba(245, 94, 108, 0.0)');

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sıcaklık (°C)',
                data: data,
                borderColor: '#f5576c',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#f5576c',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Animasyon yok (hızlı güncelleme için)
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 14,
                        weight: '700'
                    },
                    callbacks: {
                        label: function (context) {
                            return ` ${context.parsed.y.toFixed(1)}°C`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(1) + '°C';
                        },
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkipPadding: 20,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

function createHumidityChart(labels, data) {
    const ctx = document.getElementById('humidityChart').getContext('2d');

    // Eski chart'ı yok et
    if (humidityChart) {
        humidityChart.destroy();
    }

    // Gradient oluştur
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(79, 172, 254, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    humidityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nem (%)',
                data: data,
                borderColor: '#4facfe',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#4facfe',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Animasyon yok (hızlı güncelleme için)
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 14,
                        weight: '700'
                    },
                    callbacks: {
                        label: function (context) {
                            return ` ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        },
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkipPadding: 20,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// Update Charts (Optimized for Real-time)
// ============================================
function updateCharts() {
    if (!currentChannel || !currentChannel.feeds || currentChannel.feeds.length === 0) {
        return;
    }

    const feeds = currentChannel.feeds;

    // Time range'i al
    const tempRange = parseInt(document.getElementById('tempTimeRange').value);
    const humidityRange = parseInt(document.getElementById('humidityTimeRange').value);

    // Sıcaklık chart'ı için veri hazırla
    const tempFeeds = feeds.slice(0, tempRange).reverse();
    const tempLabels = tempFeeds.map(feed => {
        const date = new Date(feed.created_at);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit' // Saniye de göster (anlık takip için)
        });
    });
    const tempData = tempFeeds.map(feed => parseFloat(feed.field1));

    // Nem chart'ı için veri hazırla
    const humidityFeeds = feeds.slice(0, humidityRange).reverse();
    const humidityLabels = humidityFeeds.map(feed => {
        const date = new Date(feed.created_at);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit' // Saniye de göster (anlık takip için)
        });
    });
    const humidityData = humidityFeeds.map(feed => parseFloat(feed.field2));

    // Chart'lar zaten varsa sadece güncelle (performans için)
    if (temperatureChart && humidityChart) {
        // Sadece veriyi güncelle, chart'ı yeniden oluşturma
        temperatureChart.data.labels = tempLabels;
        temperatureChart.data.datasets[0].data = tempData;
        temperatureChart.update('none'); // Animasyon yok (hızlı güncelleme)
        
        humidityChart.data.labels = humidityLabels;
        humidityChart.data.datasets[0].data = humidityData;
        humidityChart.update('none'); // Animasyon yok (hızlı güncelleme)
    } else {
        // İlk kez oluştur
        createTemperatureChart(tempLabels, tempData);
        createHumidityChart(humidityLabels, humidityData);
    }
}

// ============================================
// Theme Change Handler
// ============================================
// Theme değiştiğinde chart renklerini güncelle
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
            const newColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary');
            Chart.defaults.color = newColor;

            // Chart'ları yeniden render et
            if (temperatureChart) temperatureChart.update();
            if (humidityChart) humidityChart.update();
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});
