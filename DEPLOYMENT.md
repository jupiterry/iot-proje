# 🚀 VPS Deployment Rehberi - devrekbenimmarketim.com

Bu rehber, `devrekbenimmarketim.com` domain'inizde çalışan MERN projenizi bozmadan IoT Analytics Platform'unu subdomain olarak (`iot.devrekbenimmarketim.com`) çalıştırmanızı sağlar.

## 📋 Ön Gereksinimler

- VPS'te Node.js ve npm yüklü
- Nginx yüklü ve çalışıyor
- PM2 yüklü (process yönetimi için)
- MERN projeniz zaten çalışıyor (örn: port 3000'de)

## 🔧 Adım 1: Projeyi VPS'e Yükleme

### Seçenek A: Git ile (Önerilen)
```bash
cd /home/your-username
git clone https://github.com/jupiterry/iot-proje.git iot-analytics
cd iot-analytics
```

### Seçenek B: SCP ile
```bash
# Yerel bilgisayarınızdan:
scp -r "c:\Users\jupit\Desktop\İOT Proje" user@your-vps-ip:/home/user/iot-analytics
```

## 🔧 Adım 2: Proje Kurulumu

```bash
cd /home/your-username/iot-analytics

# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env
nano .env
```

`.env` dosyasında port ayarını yapın:
```
PORT=3001
DB_PATH=./iot_data.sqlite
NODE_ENV=production
```

**ÖNEMLİ:** MERN projeniz 3000 portunda çalışıyorsa, IoT projesi için 3001, 3002, 8080 gibi farklı bir port kullanın!

## 🔧 Adım 3: PM2 ile Çalıştırma

```bash
# PM2'yi global olarak yükle (eğer yoksa)
npm install -g pm2

# IoT projesini PM2 ile başlat
cd /home/your-username/iot-analytics
pm2 start server.js --name iot-proje --env production

# PM2'yi sistem başlangıcında otomatik başlat
pm2 save
pm2 startup
```

PM2 komutları:
```bash
pm2 status              # Tüm process'leri görüntüle
pm2 logs iot-analytics  # Logları görüntüle
pm2 restart iot-analytics  # Yeniden başlat
pm2 stop iot-analytics     # Durdur
```

## 🔧 Adım 4: Nginx Reverse Proxy Yapılandırması

### 4.1 Yeni Nginx Site Dosyası Oluştur

```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

### 4.2 Nginx Yapılandırması

IoT projesi için subdomain kullanın: `iot.devrekbenimmarketim.com`

```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;  # IoT subdomain

    # Log dosyaları
    access_log /var/log/nginx/iot-analytics-access.log;
    error_log /var/log/nginx/iot-analytics-error.log;

    # Maksimum upload boyutu (IoT verileri için)
    client_max_body_size 1M;

    location / {
        proxy_pass http://localhost:3001;  # IoT projesinin portu
        proxy_http_version 1.1;
        
        # WebSocket desteği (gerekirse)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout ayarları
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Nginx Site'ı Aktif Et

```bash
# Symbolic link oluştur
sudo ln -s /etc/nginx/sites-available/iot-analytics /etc/nginx/sites-enabled/

# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx'i yeniden yükle
sudo systemctl reload nginx
```

## 🔧 Adım 5: SSL Sertifikası (Let's Encrypt)

```bash
# Certbot yükle (eğer yoksa)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d iot.devrekbenimmarketim.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

## 🔧 Adım 6: Firewall Ayarları

```bash
# Port 3001'i aç (sadece localhost'tan erişilebilir - Nginx üzerinden)
# Nginx zaten 80/443 portlarını dinliyor, ekstra port açmaya gerek yok

# Eğer doğrudan port erişimi istiyorsanız (önerilmez):
sudo ufw allow 3001/tcp
```

## 🔧 Adım 7: Domain DNS Ayarları

DNS panelinizde (domain sağlayıcınızın panelinde - Namecheap, GoDaddy, vb.):

**Subdomain A Record ekleyin:**
```
Type: A Record
Host: iot
Value: VPS_IP_ADRESI (devrekbenimmarketim.com'un işaret ettiği aynı IP)
TTL: 3600 (veya Auto)
```

**Örnek:**
- Ana domain: `devrekbenimmarketim.com` → `123.45.67.89`
- Subdomain: `iot.devrekbenimmarketim.com` → `123.45.67.89` (aynı IP)

**Not:** DNS değişiklikleri 5 dakika ile 24 saat arasında yayılabilir. Kontrol için:
```bash
nslookup iot.devrekbenimmarketim.com
```

## ✅ Kontrol Listesi

- [ ] Proje VPS'e yüklendi
- [ ] `npm install` çalıştırıldı
- [ ] `.env` dosyası oluşturuldu ve port ayarlandı
- [ ] PM2 ile proje başlatıldı
- [ ] Nginx yapılandırması oluşturuldu
- [ ] Nginx yeniden yüklendi
- [ ] DNS kayıtları yapıldı
- [ ] SSL sertifikası alındı (opsiyonel ama önerilir)
- [ ] `http://iot.devrekbenimmarketim.com` veya `https://iot.devrekbenimmarketim.com` çalışıyor

## 🧪 Test

### 1. PM2 Kontrolü
```bash
pm2 status
# iot-analytics process'inin "online" olduğunu görmelisiniz
```

### 2. Port Kontrolü
```bash
curl http://localhost:3001
# HTML sayfası dönmeli
```

### 3. Nginx Kontrolü
```bash
curl http://iot.devrekbenimmarketim.com
# HTML sayfası dönmeli
```

### 4. API Testi
```bash
# Channel oluştur
curl -X POST http://iot.devrekbenimmarketim.com/channels \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Channel","field1_name":"Sıcaklık","field2_name":"Nem"}'
```

## 🔄 MERN Projenizle Birlikte Çalışma

Her iki proje de aynı VPS'te çalışacak:

```
MERN Projesi:
- Port: 3000 (veya mevcut portunuz)
- Domain: devrekbenimmarketim.com
- PM2 Name: mern-app (veya mevcut adı)

IoT Projesi:
- Port: 3001
- Domain: iot.devrekbenimmarketim.com
- PM2 Name: iot-proje
```

PM2 ile her ikisini de yönetebilirsiniz:
```bash
pm2 list          # Her iki projeyi görüntüle
pm2 logs          # Tüm logları görüntüle
pm2 monit         # Real-time monitoring
```

## 🛠️ Sorun Giderme

### Port Çakışması
```bash
# Hangi portlar kullanılıyor kontrol et
sudo netstat -tulpn | grep LISTEN
# veya
sudo ss -tulpn | grep LISTEN
```

### PM2 Process Çalışmıyor
```bash
pm2 logs iot-analytics --lines 50  # Son 50 satır log
pm2 restart iot-analytics
```

### Nginx 502 Bad Gateway
- PM2'de process'in çalıştığını kontrol edin
- Port numarasının doğru olduğunu kontrol edin
- Nginx error log: `sudo tail -f /var/log/nginx/iot-analytics-error.log`

### Domain Erişilemiyor
- DNS kayıtlarının yayıldığını kontrol edin: `nslookup iot.devrekbenimmarketim.com`
- Firewall'da 80/443 portlarının açık olduğunu kontrol edin
- DNS yayılması 5-24 saat sürebilir, sabırlı olun

## 📝 Notlar

- Her iki proje de bağımsız çalışır, birbirini etkilemez
- SQLite veritabanı dosyası proje klasöründe oluşur
- PM2 ile otomatik restart ve log yönetimi yapılır
- Nginx reverse proxy sayesinde SSL ve domain yönetimi kolaydır

## 🎉 Başarılı!

Artık IoT projeniz `iot.devrekbenimmarketim.com` adresinde, MERN projeniz ise `devrekbenimmarketim.com` adresinde çalışıyor!

## 📱 ESP8266 Ayarları

Arduino kodunuzda server adresini güncelleyin:

```cpp
// API Ayarları
String apiKey = "DASHBOARD_DAN_ALDIGINIZ_API_KEY";
const char* server = "iot.devrekbenimmarketim.com";  // Subdomain
const int serverPort = 80;  // HTTP için 80, HTTPS için 443
```

**HTTPS kullanıyorsanız:**
```cpp
const char* server = "iot.devrekbenimmarketim.com";
const int serverPort = 443;
// WiFiClientSecure client; kullanın
```

