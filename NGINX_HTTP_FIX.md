# 🔧 HTTP 301 Redirect Sorunu Çözümü

## Sorun
ESP8266'dan HTTP isteği gönderildiğinde Nginx HTTP 301 (Moved Permanently) hatası veriyor ve HTTPS'e yönlendiriyor. ESP8266 HTTPS desteklemediği için veri gönderilemiyor.

## ✅ Çözüm: Nginx Yapılandırmasını Düzelt

VPS'inizde şu adımları izleyin:

### 1. Nginx Yapılandırma Dosyasını Açın
```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

### 2. HTTP'den HTTPS'e Yönlendirmeyi Kaldırın

**ÖNCEKİ HALİ (Yanlış):**
```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;
    
    # Bu satır HTTP'yi HTTPS'e yönlendiriyor - ESP8266 için sorun!
    return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:3001;
        # ...
    }
}
```

**DOĞRU HALİ:**
```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;

    access_log /var/log/nginx/iot-analytics-access.log;
    error_log /var/log/nginx/iot-analytics-error.log;
    client_max_body_size 1M;

    # HTTP'den HTTPS'e yönlendirme YOK (ESP8266 için gerekli)
    # return 301 https://$server_name$request_uri;  # Bu satırı SİLİN!

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

### 3. Nginx Yapılandırmasını Test Edin
```bash
sudo nginx -t
```

### 4. Nginx'i Yeniden Yükleyin
```bash
sudo systemctl reload nginx
```

### 5. Test Edin
```bash
# HTTP isteği test et
curl -X POST http://iot.devrekbenimmarketim.com/update \
  -H "X-THINGSPEAKAPIKEY: YOUR_API_KEY" \
  -d "field1=25&field2=60"

# 200 OK dönmeli, 301 dönmemeli!
```

## 🔍 Sorun Devam Ederse

### Nginx Yapılandırmasını Kontrol Edin
```bash
# Tüm Nginx site dosyalarını kontrol edin
sudo ls -la /etc/nginx/sites-enabled/

# Ana Nginx yapılandırmasını kontrol edin
sudo nano /etc/nginx/nginx.conf

# Varsayılan site yapılandırmasını kontrol edin
sudo nano /etc/nginx/sites-available/default
```

### Certbot Yönlendirmesi
Eğer `certbot` kullanarak SSL kurduysanız, otomatik olarak HTTP'den HTTPS'e yönlendirme eklemiş olabilir. Bunu kaldırmanız gerekir:

```bash
# Certbot yapılandırmasını kontrol edin
sudo cat /etc/letsencrypt/renewal/iot.devrekbenimmarketim.com.conf
```

### Alternatif: Sadece /update Endpoint'i için HTTP'ye İzin Ver
Eğer tarayıcılar için HTTPS, ESP8266 için HTTP istiyorsanız:

```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;

    # Sadece /update endpoint'i için HTTP'ye izin ver
    location /update {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Diğer tüm istekler HTTPS'e yönlendir
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

## ✅ Başarı Kontrolü

ESP8266 Serial Monitor'da şunu görmelisiniz:
```
📊 HTTP Status: 200
✅ Başarılı! Entry ID: 1234
```

301 hatası görünmemeli!

## 📝 Notlar

- HTTP (port 80) ESP8266 için gerekli
- HTTPS (port 443) tarayıcılar için güvenli
- Her ikisi de aynı anda çalışabilir
- ESP8266 HTTPS desteklemiyor (ekstra kütüphane gerekir)

