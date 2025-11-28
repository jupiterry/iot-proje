# 🔧 HTTPS Yönlendirme Sorunu - Çözüm

## ❌ Sorun
`https://iot.devrekbenimmarketim.com` adresine girince ana domain (MERN) görünüyor.

## 🔍 Neden
- HTTP (80) üzerinden IoT çalışıyor ✅
- HTTPS (443) üzerinden IoT yapılandırması YOK ❌
- Tarayıcı otomatik olarak HTTPS'e yönlendiriyor
- HTTPS'te default server (ana domain) kullanılıyor

## ✅ Çözüm 1: HTTP'ye Zorla Yönlendirme (SSL Olmadan)

IoT subdomain için HTTPS bloğu ekleyip HTTP'ye yönlendirelim:

```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

**Mevcut içeriğe ekleyin:**

```nginx
# HTTP - Ana yapılandırma
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

# HTTPS - HTTP'ye yönlendir (SSL yok)
server {
    listen 443 ssl http2;
    server_name iot.devrekbenimmarketim.com;
    
    # Geçici self-signed sertifika (sadece yönlendirme için)
    # Veya yönlendirme yapmadan direkt HTTP'ye yönlendir
    return 301 http://$server_name$request_uri;
}
```

**AMA:** Self-signed sertifika olmadan bu çalışmaz. Daha iyi çözüm:

## ✅ Çözüm 2: HTTPS'i Tamamen Devre Dışı Bırak (Önerilen)

Ana domain'in HTTPS yapılandırmasında IoT subdomain'i hariç tutun:

```bash
sudo nano /etc/nginx/sites-available/devrekbenimmarketim.com
```

**Ana domain'in HTTPS bloğunu kontrol edin. Şöyle olmalı:**

```nginx
# HTTP - HTTPS'e yönlendir (SADECE ana domain için)
server {
    listen 80;
    server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # ✅ Sadece ana domain
    
    return 301 https://$host$request_uri;
}

# HTTPS - Ana domain
server {
    listen 443 ssl http2;
    server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # ✅ Sadece ana domain
    
    # SSL ayarları...
    location / {
        proxy_pass http://localhost:3000;  # MERN
    }
}
```

## ✅ Çözüm 3: IoT için Basit HTTPS Yapılandırması (En İyi)

IoT için de HTTPS ekleyin ama basit bir yapılandırma:

```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

**Tam içerik:**

```nginx
# HTTP - HTTPS'e yönlendir
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS - IoT projesi
server {
    listen 443 ssl http2;
    server_name iot.devrekbenimmarketim.com;

    # Ana domain'in SSL sertifikasını kullan (wildcard veya SAN sertifika)
    # VEYA IoT için ayrı sertifika al
    ssl_certificate /etc/letsencrypt/live/devrekbenimmarketim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/devrekbenimmarketim.com/privkey.pem;
    
    # Eğer wildcard sertifika varsa:
    # ssl_certificate /etc/letsencrypt/live/*.devrekbenimmarketim.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/*.devrekbenimmarketim.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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

**Sonra SSL sertifikası alın:**
```bash
sudo certbot --nginx -d iot.devrekbenimmarketim.com
```

## 🎯 Hızlı Çözüm (SSL Olmadan - Geçici)

Eğer SSL eklemek istemiyorsanız, tarayıcıda HTTP kullanın:

**Tarayıcıda:**
```
http://iot.devrekbenimmarketim.com  ✅ (Çalışır)
https://iot.devrekbenimmarketim.com  ❌ (Ana domain'e gider)
```

**Veya HSTS'yi temizleyin:**
- Chrome: `chrome://net-internals/#hsts`
- Domain'i silin ve tekrar deneyin

## 📝 Özet

1. **HTTP (80)** üzerinden IoT çalışıyor ✅
2. **HTTPS (443)** üzerinden IoT yapılandırması yok ❌
3. **Çözüm:** IoT için HTTPS yapılandırması ekleyin veya HTTP kullanın

