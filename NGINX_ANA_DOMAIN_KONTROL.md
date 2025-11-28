# 🔍 Ana Domain Yapılandırması Kontrolü

## ❌ Sorun
`iot.devrekbenimmarketim.com` adresine girince `devrekbenimmarketim.com`'un içeriği görünüyor.

## 🔍 Neden
Ana domain'in Nginx yapılandırması subdomain'i de yakalıyor olabilir.

## ✅ Çözüm Adımları

### 1. Ana Domain Yapılandırmasını Kontrol Et

```bash
# Ana domain'in Nginx yapılandırmasını görüntüle
sudo cat /etc/nginx/sites-available/devrekbenimmarketim.com
```

**Kontrol edilecekler:**
- `server_name` kısmı sadece `devrekbenimmarketim.com` olmalı
- Wildcard (`*`) veya default (`_`) olmamalı
- Subdomain'i kapsamamalı

### 2. Yanlış Yapılandırma Örnekleri

❌ **YANLIŞ:**
```nginx
server_name _;  # Tüm domainleri yakalar
server_name *.devrekbenimmarketim.com;  # Tüm subdomainleri yakalar
server_name devrekbenimmarketim.com *.devrekbenimmarketim.com;  # Subdomainleri de yakalar
```

✅ **DOĞRU:**
```nginx
server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # Sadece ana domain
```

### 3. Ana Domain Yapılandırmasını Düzelt

```bash
sudo nano /etc/nginx/sites-available/devrekbenimmarketim.com
```

**server_name kısmını şöyle yapın:**
```nginx
server {
    listen 80;
    listen 443 ssl http2;  # Eğer SSL varsa
    
    server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # ✅ Sadece ana domain
    
    # ... diğer ayarlar
    location / {
        proxy_pass http://localhost:3000;  # MERN projesi
    }
}
```

### 4. IoT Subdomain Yapılandırmasını Kontrol Et

```bash
sudo cat /etc/nginx/sites-available/iot-analytics
```

**Şöyle olmalı:**
```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;  # ✅ Sadece IoT subdomain
    
    location / {
        proxy_pass http://localhost:3001;  # IoT projesi
    }
}
```

### 5. Nginx Site Dosyalarının Sırasını Kontrol Et

```bash
# Aktif site dosyalarını listele
ls -la /etc/nginx/sites-enabled/
```

**Önemli:** Nginx alfabetik sıraya göre yükler. Eğer:
- `devrekbenimmarketim.com` → İlk yüklenir
- `iot-analytics` → Sonra yüklenir

Bu sıra doğru. Ama eğer ana domain `default` veya `00-` ile başlıyorsa, IoT için de numara ekleyin.

### 6. Nginx Yapılandırmasını Test Et

```bash
# Hangi server_name'lerin aktif olduğunu gör
sudo nginx -T | grep -A 3 "server_name"

# Yapılandırmayı test et
sudo nginx -t

# Nginx'i yeniden yükle
sudo systemctl reload nginx
```

### 7. Test Et

```bash
# Ana domain
curl -H "Host: devrekbenimmarketim.com" http://localhost

# IoT subdomain
curl -H "Host: iot.devrekbenimmarketim.com" http://localhost
```

## 🎯 Hızlı Çözüm Komutları

```bash
# 1. Ana domain yapılandırmasını kontrol et
sudo cat /etc/nginx/sites-available/devrekbenimmarketim.com | grep server_name

# 2. IoT subdomain yapılandırmasını kontrol et
sudo cat /etc/nginx/sites-available/iot-analytics | grep server_name

# 3. Nginx'in hangi server_name'leri tanıdığını gör
sudo nginx -T 2>/dev/null | grep -E "server_name|listen" | grep -A 1 "listen"

# 4. Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/access.log
```

## 🔧 Örnek: Doğru Yapılandırma

### Ana Domain (`/etc/nginx/sites-available/devrekbenimmarketim.com`)
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name devrekbenimmarketim.com www.devrekbenimmarketim.com;  # ✅ Sadece ana domain
    
    ssl_certificate /etc/letsencrypt/live/devrekbenimmarketim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/devrekbenimmarketim.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;  # MERN projesi
    }
}
```

### IoT Subdomain (`/etc/nginx/sites-available/iot-analytics`)
```nginx
server {
    listen 80;
    server_name iot.devrekbenimmarketim.com;  # ✅ Sadece IoT subdomain
    
    location / {
        proxy_pass http://localhost:3001;  # IoT projesi
    }
}
```

## ⚠️ Önemli Notlar

1. **server_name kesin eşleşme yapar** - `iot.devrekbenimmarketim.com` sadece IoT yapılandırmasında olmalı
2. **Ana domain wildcard kullanmamalı** - `*.devrekbenimmarketim.com` kullanmayın
3. **Default server olmamalı** - `server_name _;` kullanmayın
4. **Her değişiklikten sonra** `sudo nginx -t && sudo systemctl reload nginx` çalıştırın

## 🆘 Hala Çalışmıyorsa

1. **Browser cache temizle** (Ctrl+Shift+Delete)
2. **Incognito mode'da test et**
3. **DNS cache temizle:**
   ```bash
   # Windows
   ipconfig /flushdns
   ```
4. **Nginx'i tamamen restart et:**
   ```bash
   sudo systemctl restart nginx
   ```

