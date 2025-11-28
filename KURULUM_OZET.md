# 🚀 Hızlı Kurulum Özeti - devrekbenimmarketim.com

## 📍 Domain Yapısı

- **Ana Domain (MERN):** `devrekbenimmarketim.com` → Port 3000
- **IoT Subdomain:** `iot.devrekbenimmarketim.com` → Port 3001

## ⚡ Hızlı Adımlar

### 1️⃣ VPS'te Projeyi Klonla
```bash
cd /home/your-username
git clone https://github.com/jupiterry/iot-proje.git iot-analytics
cd iot-analytics
npm install
```

### 2️⃣ .env Dosyası Oluştur
```bash
cp .env.example .env
nano .env
```

İçeriği:
```
PORT=3001
DB_PATH=./iot_data.sqlite
NODE_ENV=production
```

### 3️⃣ PM2 ile Başlat
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

### 4️⃣ Nginx Yapılandırması
```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

Aşağıdaki içeriği yapıştırın:
```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;

    access_log /var/log/nginx/iot-analytics-access.log;
    error_log /var/log/nginx/iot-analytics-error.log;
    client_max_body_size 1M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktif et:
```bash
sudo ln -s /etc/nginx/sites-available/iot-analytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5️⃣ DNS Ayarları

Domain sağlayıcınızın panelinde (Namecheap, GoDaddy, vb.):

**A Record ekle:**
- **Type:** A Record
- **Host:** `iot`
- **Value:** VPS IP adresiniz (devrekbenimmarketim.com'un işaret ettiği aynı IP)
- **TTL:** 3600

### 6️⃣ SSL Sertifikası (HTTPS için)
```bash
sudo certbot --nginx -d iot.devrekbenimmarketim.com
```

## ✅ Test

1. **PM2 Kontrolü:**
   ```bash
   pm2 status
   ```

2. **Tarayıcıda Aç:**
   ```
   http://iot.devrekbenimmarketim.com
   ```

3. **API Testi:**
   ```bash
   curl http://iot.devrekbenimmarketim.com/channels
   ```

## 📱 ESP8266 Arduino Kodu Ayarları

`arduino/esp8266_iot.ino` dosyasında şu satırları güncelleyin:

```cpp
// API Ayarları
String apiKey = "DASHBOARD_DAN_ALDIGINIZ_API_KEY";
const char* server = "iot.devrekbenimmarketim.com";  // Subdomain
const int serverPort = 80;  // HTTP için 80, HTTPS için 443
```

**HTTPS kullanıyorsanız:**
- Port: `443`
- `WiFiClientSecure client;` kullanın (kodda değişiklik gerekir)

## 🔍 Sorun Giderme

### DNS Yayılmadı
```bash
nslookup iot.devrekbenimmarketim.com
# 5-24 saat sürebilir
```

### PM2 Çalışmıyor
```bash
pm2 logs iot-proje --lines 50
pm2 restart iot-proje
```

### Nginx 502 Hatası
```bash
# Port kontrolü
sudo netstat -tulpn | grep 3001

# Nginx log
sudo tail -f /var/log/nginx/iot-analytics-error.log
```

## 📝 Önemli Notlar

- ✅ MERN projeniz `devrekbenimmarketim.com` adresinde çalışmaya devam eder
- ✅ IoT projesi `iot.devrekbenimmarketim.com` adresinde çalışır
- ✅ Her iki proje de bağımsızdır, birbirini etkilemez
- ✅ PM2 ile her ikisini de yönetebilirsiniz: `pm2 list`

## 🎉 Başarılı!

Artık:
- **MERN:** `devrekbenimmarketim.com`
- **IoT:** `iot.devrekbenimmarketim.com`

Her ikisi de aynı VPS'te çalışıyor! 🚀

