# 🔒 SSL Sertifikasını Kaldırma ve Yönlendirme Sorunu Çözümü

## Sorun
`iot.devrekbenimmarketim.com` adresine girildiğinde `devrekbenimmarketim.com` ana domain'e yönlendiriliyor.

## ✅ Çözüm: SSL Sertifikasını Kaldırma

### 1. Certbot ile SSL Sertifikasını Kaldırın

```bash
# Certbot ile sertifikayı kaldır
sudo certbot delete --cert-name iot.devrekbenimmarketim.com
```

Veya manuel olarak:

```bash
# Sertifika dosyalarını sil
sudo rm -rf /etc/letsencrypt/live/iot.devrekbenimmarketim.com
sudo rm -rf /etc/letsencrypt/archive/iot.devrekbenimmarketim.com
sudo rm -rf /etc/letsencrypt/renewal/iot.devrekbenimmarketim.com.conf
```

### 2. Nginx Yapılandırma Dosyasını Temizleyin

```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

**Dosyanın tamamını silin ve şunu yazın:**

```nginx
# HTTP Server - ESP8266 için (Port 80)
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

**ÖNEMLİ:** 
- SSL ile ilgili TÜM satırları silin
- `return 301` veya `return 302` içeren satırları silin
- Sadece yukarıdaki `server` bloğu kalsın

### 3. Ana Domain Yapılandırmasını Kontrol Edin

Ana domain (`devrekbenimmarketim.com`) yapılandırmasında `iot` subdomain'ine yönlendirme olup olmadığını kontrol edin:

```bash
sudo nano /etc/nginx/sites-available/devrekbenimmarketim.com
# veya
sudo nano /etc/nginx/sites-available/default
```

Eğer şöyle bir satır varsa, silin:
```nginx
# YANLIŞ - Bu satırı silin
return 301 https://devrekbenimmarketim.com$request_uri;
```

### 4. Nginx Yapılandırmasını Test Edin

```bash
sudo nginx -t
```

Hata yoksa devam edin.

### 5. Nginx'i Yeniden Yükleyin

```bash
sudo systemctl reload nginx
```

### 6. Test Edin

```bash
# HTTP isteği test et
curl -I http://iot.devrekbenimmarketim.com

# 200 OK dönmeli, 301/302 dönmemeli
```

Tarayıcıda test:
```
http://iot.devrekbenimmarketim.com
```

Ana domain'e yönlendirmemeli, direkt IoT dashboard'u açmalı.

## 🔍 Sorun Devam Ederse

### Tüm Nginx Yapılandırmalarını Kontrol Edin

```bash
# Tüm aktif site yapılandırmalarını listele
sudo ls -la /etc/nginx/sites-enabled/

# Her birini kontrol edin
sudo cat /etc/nginx/sites-enabled/iot-analytics
sudo cat /etc/nginx/sites-enabled/devrekbenimmarketim.com
sudo cat /etc/nginx/sites-enabled/default
```

### Ana Nginx Yapılandırmasını Kontrol Edin

```bash
sudo nano /etc/nginx/nginx.conf
```

`server_name` veya `return` direktifleri olup olmadığını kontrol edin.

### DNS Kontrolü

```bash
# DNS kayıtlarını kontrol et
nslookup iot.devrekbenimmarketim.com
dig iot.devrekbenimmarketim.com
```

Aynı IP adresini göstermeli.

## ✅ Başarı Kontrolü

1. **Tarayıcıda:** `http://iot.devrekbenimmarketim.com` → IoT Dashboard açılmalı
2. **ESP8266:** HTTP 200 OK almalı, 301/302 almamalı
3. **Ana domain:** `http://devrekbenimmarketim.com` → MERN projesi açılmalı

## 📝 Notlar

- SSL sertifikası kaldırıldıktan sonra sadece HTTP (port 80) çalışacak
- ESP8266 için bu yeterli
- Tarayıcılar için HTTPS istiyorsanız, daha sonra tekrar SSL kurabilirsiniz (ama HTTP yönlendirmesi olmadan)

