# 🔧 Nginx Subdomain Yönlendirme Sorunu - Çözüm

## ❌ Sorun
`https://iot.devrekbenimmarketim.com` adresine girince `devrekbenimmarketim.com`'a yönlendiriliyor.

## 🔍 Olası Nedenler ve Çözümler

### 1️⃣ Ana Domain'in Nginx Yapılandırması Subdomain'i Yakalıyor

**Kontrol:**
```bash
# Ana domain'in Nginx yapılandırmasını kontrol edin
sudo nano /etc/nginx/sites-available/devrekbenimmarketim.com
# veya
sudo nano /etc/nginx/sites-available/default
```

**Sorun:** Ana domain'in `server_name` kısmı şöyle olabilir:
```nginx
server_name devrekbenimmarketim.com *.devrekbenimmarketim.com;  # ❌ YANLIŞ
# veya
server_name _;  # ❌ YANLIŞ - Bu tüm domainleri yakalar
```

**Çözüm:** Ana domain'in `server_name`'ini sadece kendi domain'i ile sınırlayın:
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # ✅ DOĞRU
    
    # ... diğer ayarlar
}
```

### 2️⃣ SSL Sertifikası Yapılandırması Eksik

**Kontrol:**
```bash
# IoT subdomain için SSL yapılandırması var mı?
sudo ls -la /etc/nginx/sites-available/ | grep iot
sudo cat /etc/nginx/sites-available/iot-analytics
```

**Sorun:** HTTPS için SSL yapılandırması eksik olabilir.

**Çözüm:** IoT subdomain için SSL yapılandırması ekleyin:

```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

İçeriği şöyle olmalı:

```nginx
# HTTP - HTTPS'e yönlendir
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;
    
    # HTTPS'e yönlendir
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name iot.devrekbenimmarketim.com;

    # SSL Sertifikaları
    ssl_certificate /etc/letsencrypt/live/iot.devrekbenimmarketim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iot.devrekbenimmarketim.com/privkey.pem;
    
    # SSL Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Log dosyaları
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

### 3️⃣ Nginx Site Dosyalarının Sırası

**Kontrol:**
```bash
# Hangi site dosyaları aktif?
ls -la /etc/nginx/sites-enabled/
```

**Sorun:** Default site veya ana domain site dosyası önce yükleniyor olabilir.

**Çözüm:** Site dosyalarının isimlerini kontrol edin. Nginx alfabetik sıraya göre yükler:
- `00-default` → İlk yüklenir
- `devrekbenimmarketim` → Sonra yüklenir
- `iot-analytics` → En son yüklenir

Eğer ana domain `00-` veya `01-` ile başlıyorsa, IoT için de numara ekleyin:
```bash
sudo mv /etc/nginx/sites-available/iot-analytics /etc/nginx/sites-available/02-iot-analytics
sudo rm /etc/nginx/sites-enabled/iot-analytics
sudo ln -s /etc/nginx/sites-available/02-iot-analytics /etc/nginx/sites-enabled/
```

### 4️⃣ SSL Sertifikası Oluşturma

Eğer SSL sertifikası yoksa:

```bash
# SSL sertifikası al
sudo certbot --nginx -d iot.devrekbenimmarketim.com

# Eğer hata alırsanız, manuel olarak:
sudo certbot certonly --nginx -d iot.devrekbenimmarketim.com
```

### 5️⃣ Nginx Yapılandırmasını Test Etme

```bash
# Yapılandırmayı test et
sudo nginx -t

# Eğer hata varsa düzeltin, sonra:
sudo systemctl reload nginx
# veya
sudo systemctl restart nginx
```

## 🔍 Detaylı Kontrol Adımları

### Adım 1: Tüm Nginx Site Dosyalarını Kontrol Et
```bash
# Tüm site dosyalarını listele
sudo ls -la /etc/nginx/sites-available/
sudo ls -la /etc/nginx/sites-enabled/

# Her birini kontrol et
sudo cat /etc/nginx/sites-available/default
sudo cat /etc/nginx/sites-available/devrekbenimmarketim.com  # veya ana domain dosyası
sudo cat /etc/nginx/sites-available/iot-analytics
```

### Adım 2: Hangi Server Blok Hangi Domain'i Yakalıyor?
```bash
# Nginx yapılandırmasını test et ve hangi server_name'lerin aktif olduğunu gör
sudo nginx -T | grep -A 5 "server_name"
```

### Adım 3: Nginx Loglarını Kontrol Et
```bash
# Access log'u kontrol et
sudo tail -f /var/log/nginx/access.log

# Error log'u kontrol et
sudo tail -f /var/log/nginx/error.log

# IoT için özel log
sudo tail -f /var/log/nginx/iot-analytics-access.log
sudo tail -f /var/log/nginx/iot-analytics-error.log
```

### Adım 4: DNS Kontrolü
```bash
# DNS'in doğru çalıştığını kontrol et
nslookup iot.devrekbenimmarketim.com
dig iot.devrekbenimmarketim.com

# IP adresinin doğru olduğunu kontrol et
curl -I http://iot.devrekbenimmarketim.com
```

## ✅ Hızlı Çözüm (En Olası)

1. **Ana domain yapılandırmasını kontrol edin:**
```bash
sudo nano /etc/nginx/sites-available/devrekbenimmarketim.com
```

`server_name` kısmının şöyle olduğundan emin olun:
```nginx
server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;
```

2. **IoT subdomain için SSL yapılandırması ekleyin:**
```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

Yukarıdaki SSL yapılandırmasını ekleyin.

3. **Nginx'i yeniden yükleyin:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

4. **Test edin:**
```bash
curl -I https://iot.devrekbenimmarketim.com
```

## 🆘 Hala Çalışmıyorsa

1. **Browser cache'i temizleyin** (Ctrl+Shift+Delete)
2. **Incognito/Private mode'da test edin**
3. **Farklı bir tarayıcı deneyin**
4. **DNS cache'i temizleyin:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Linux/Mac
   sudo systemd-resolve --flush-caches
   ```

5. **PM2'de IoT projesinin çalıştığını kontrol edin:**
   ```bash
   pm2 status
   pm2 logs iot-proje
   ```

6. **Port 3001'in açık olduğunu kontrol edin:**
   ```bash
   curl http://localhost:3001
   ```

## 📝 Örnek: Doğru Nginx Yapılandırması

### Ana Domain (devrekbenimmarketim.com)
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # ✅ Sadece ana domain
    
    # SSL ayarları...
    # MERN projesi proxy ayarları...
    location / {
        proxy_pass http://localhost:3000;  # MERN projesi
    }
}
```

### IoT Subdomain (iot.devrekbenimmarketim.com)
```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name iot.devrekbenimmarketim.com;  # ✅ Sadece IoT subdomain
    
    # SSL ayarları...
    location / {
        proxy_pass http://localhost:3001;  # IoT projesi
    }
}
```

Bu şekilde her domain kendi server bloğuna yönlendirilir! 🎯

