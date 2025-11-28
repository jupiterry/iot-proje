# 🌡️ IoT Analytics Platform

ThingSpeak benzeri, ESP8266 uyumlu IoT veri toplama ve görselleştirme platformu.

![Dashboard Preview](https://img.shields.io/badge/Status-Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Özellikler

- 📡 **ThingSpeak Uyumlu API** - Mevcut ESP8266 kodlarınızı minimum değişiklikle kullanın
- 📊 **Modern Dashboard** - Real-time grafikler ve istatistikler
- 🌓 **Dark Mode** - Göz dostu aydınlık/karanlık tema
- 📱 **Responsive Design** - Mobil ve masaüstü uyumlu
- 🔒 **API Key Güvenliği** - Her channel için benzersiz API key
- 💾 **SQLite Database** - Kolay kurulum, dosya tabanlı veritabanı
- ⚡ **Real-time Updates** - 15 saniyede bir otomatik güncelleme

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 14+ ve npm
- ESP8266 veya ESP32 (DHT11/DHT22 sensör ile)
- VPS veya yerel sunucu

### Kurulum

1. **Projeyi klonlayın veya indirin**
   ```bash
   cd "c:\Users\jupit\Desktop\İOT Proje"
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın** (isteğe bağlı)
   ```bash
   # .env dosyası zaten hazır, gerekirse düzenleyin
   PORT=3000
   DB_PATH=./iot_data.sqlite
   ```

4. **Sunucuyu başlatın**
   ```bash
   npm start
   ```

5. **Dashboard'u açın**
   ```
   http://localhost:3000
   ```

## 📡 ESP8266 Kurulumu

### 1. Channel Oluşturma

1. Dashboard'u açın: `http://localhost:3000`
2. "Yeni Channel" butonuna tıklayın
3. Channel bilgilerini doldurun:
   - **Channel Adı**: Örn: "Sıcaklık Sensörü"
   - **Field 1**: "Sıcaklık"
   - **Field 2**: "Nem"
4. **API Key**'i kopyalayın

### 2. Arduino Kodunu Güncelleyin

`arduino/esp8266_iot.ino` dosyasını Arduino IDE'de açın ve şu değerleri güncelleyin:

```cpp
// WiFi Ayarları
const char *ssid = "WiFi_Aginiz";
const char *pass = "WiFi_Sifreniz";

// API Ayarları
String apiKey = "DASHBOARD_DAN_ALDIGINIZ_API_KEY";
const char* server = "192.168.1.100";  // VPS IP veya domain
const int serverPort = 3000;
```

### 3. ESP8266'ya Yükleyin

1. ESP8266'yı bilgisayara bağlayın
2. Arduino IDE'de:
   - Board: "NodeMCU 1.0 (ESP-12E Module)"
   - Port: ESP8266'nın bağlı olduğu port
3. Upload butonuna tıklayın
4. Serial Monitor'dan veri akışını izleyin

## 🛠️ API Dokümantasyonu

### Veri Gönderme (ESP8266'dan)

```http
POST /update
Headers:
  X-THINGSPEAKAPIKEY: your_api_key_here
  Content-Type: application/x-www-form-urlencoded

Body:
  field1=25.5&field2=60.2&field3=...&field4=...
```

**Yanıt**: Entry ID (örn: "1234")

### Veri Okuma

```http
GET /channels/{channelId}/feeds.json?results=100

Response:
{
  "channel": {
    "id": 1,
    "name": "Sıcaklık Sensörü",
    "field1": "Sıcaklık",
    "field2": "Nem"
  },
  "feeds": [
    {
      "id": 1,
      "field1": "25.5",
      "field2": "60.2",
      "created_at": "2025-11-28T19:00:00.000Z"
    }
  ]
}
```

### Channel Yönetimi

**Yeni Channel Oluştur**
```http
POST /channels
Content-Type: application/json

{
  "name": "Test Channel",
  "description": "Açıklama",
  "field1_name": "Sıcaklık",
  "field2_name": "Nem"
}
```

**Channel Listele**
```http
GET /channels
```

**Channel Detayı**
```http
GET /channels/{id}
```

**İstatistikler**
```http
GET /channels/{id}/stats?field=field1
```

## 🖥️ VPS Deployment

### 1. Dosyaları VPS'e Yükleyin

```bash
# SCP ile yükleme
scp -r "c:\Users\jupit\Desktop\İOT Proje" user@your-vps-ip:/home/user/

# Veya Git kullanarak
git clone your-repo-url
cd iot-analytics-platform
```

### 2. VPS'de Kurulum

```bash
# Bağımlılıkları yükle
npm install

# PM2 ile production modunda çalıştır
npm install -g pm2
pm2 start server.js --name iot-analytics
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy (İsteğe Bağlı)

```nginx
server {
    listen 80;
    server_name iot.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Firewall Ayarları

```bash
# Port 3000'i aç
sudo ufw allow 3000
```

## 📊 Dashboard Özellikleri

### Ana Sayfa
- Channel seçimi
- API key görüntüleme ve kopyalama
- Real-time istatistikler (son ölçüm, min/max değerler)
- Toplam veri sayısı
- Son güncelleme zamanı

### Grafikler
- Sıcaklık grafiği (zaman serisi)
- Nem grafiği (zaman serisi)
- Son 50/100/200 veri görüntüleme
- Otomatik 15 saniyede bir güncelleme

### Dark Mode
- Tema değiştirme butonu
- Tercih localStorage'da saklanır
- Tüm grafik ve UI elementleri uyumlu

## 🔧 Yapılandırma

### Port Değiştirme
`.env` dosyasında:
```
PORT=8080
```

### Veritabanı Yolu
```
DB_PATH=/var/lib/iot-data.sqlite
```

### Eski Verileri Temizleme
API üzerinden veya doğrudan kod ile:

```javascript
// 30 günden eski verileri sil
await Feed.deleteOlderThan(channelId, 30);
```

## 🧪 Test

### API Testi (curl ile)

1. Channel oluştur:
```bash
curl -X POST http://localhost:3000/channels \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Channel","field1_name":"Sıcaklık","field2_name":"Nem"}'
```

2. Veri gönder:
```bash
curl -X POST http://localhost:3000/update \
  -H "X-THINGSPEAKAPIKEY: YOUR_API_KEY" \
  -d "field1=25&field2=60"
```

3. Verileri oku:
```bash
curl http://localhost:3000/channels/1/feeds.json?results=10
```

## 📝 Notlar

- ThingSpeak minimum 15 saniye updateInterval gerektirir
- SQLite dosyası otomatik oluşturulur
- API key'ler otomatik generate edilir (32 karakter hex)
- Maksimum 4 field desteklenir (isteğe bağlı arttırılabilir)

## 🆘 Sorun Giderme

### "Sunucuya bağlanılamadı" hatası
- VPS IP adresinin doğru olduğundan emin olun
- Firewall'da port 3000'in açık olduğunu kontrol edin
- VPS'de sunucunun çalıştığını kontrol edin: `pm2 status`

### "Geçersiz API key" hatası
- Dashboard'dan doğru API key'i kopyaladığınızdan emin olun
- API key'de boşluk olmadığını kontrol edin

### WiFi bağlantı sorunu
- SSID ve şifrenin doğru olduğunu kontrol edin
- ESP8266'nın WiFi menzilinde olduğunu kontrol edin

## 📄 Lisans

MIT License - İstediğiniz gibi kullanabilirsiniz!

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır!

---

**Yapım:** IoT Analytics Platform  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 2025-11-28
