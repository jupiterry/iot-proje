# 🔧 Nginx Yapılandırması Düzeltme - SSL Olmadan

## ❌ Mevcut Sorunlar

1. Port 3000 kullanılmış → **3001 olmalı** (MERN 3000'de)
2. `server_name iot.example.com` → **iot.devrekbenimmarketim.com olmalı**
3. SSL sertifikası yolu var ama sertifika yok → **SSL bloğunu kaldır**

## ✅ Çözüm

VPS'te şu komutları çalıştırın:

```bash
# Mevcut yapılandırmayı düzenle
sudo nano /etc/nginx/sites-available/iot-analytics
```

**Aşağıdaki içeriği yapıştırın (ESKİ İÇERİĞİ SİLİN):**

```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;  # ✅ Doğru domain

    # Log dosyaları
    access_log /var/log/nginx/iot-analytics-access.log;
    error_log /var/log/nginx/iot-analytics-error.log;

    # Maksimum upload boyutu
    client_max_body_size 1M;

    location / {
        proxy_pass http://localhost:3001;  # ✅ Port 3001 (MERN 3000'de)
        
        proxy_http_version 1.1;
        
        # WebSocket desteği
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

**ÖNEMLİ:** SSL bloğu YOK! Sadece HTTP (port 80).

## 🔄 Nginx'i Yeniden Yükle

```bash
# Yapılandırmayı test et
sudo nginx -t

# Eğer hata yoksa yeniden yükle
sudo systemctl reload nginx

# Veya restart
sudo systemctl restart nginx
```

## ✅ Kontrol

```bash
# Nginx durumunu kontrol et
sudo systemctl status nginx

# Port 3001'in çalıştığını kontrol et
curl http://localhost:3001

# Subdomain'i test et
curl http://iot.devrekbenimmarketim.com
```

## 📱 ESP8266 Ayarları

Arduino kodunda:
```cpp
const char* server = "iot.devrekbenimmarketim.com";
const int serverPort = 80;  // ✅ HTTP için 80
```

**NOT:** HTTPS kullanmıyorsunuz, bu yüzden port 80 ve normal `WiFiClient` kullanın.

## 🎯 Özet Değişiklikler

1. ✅ Port: 3000 → **3001**
2. ✅ Domain: iot.example.com → **iot.devrekbenimmarketim.com**
3. ✅ SSL: Kaldırıldı (sadece HTTP)
4. ✅ ESP8266: Port 80 kullanacak

Bu şekilde 301 hatası gitmeli! 🚀

