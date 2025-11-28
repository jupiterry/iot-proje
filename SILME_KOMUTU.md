# Nginx Yapılandırma Dosyasını Silme

## ⚠️ DİKKAT: Dosyayı silmeden önce yedek alın!

### 1. Önce Yedek Alın
```bash
sudo cp /etc/nginx/sites-available/iot-analytics /etc/nginx/sites-available/iot-analytics.backup
```

### 2. Dosyayı Silin
```bash
sudo rm /etc/nginx/sites-available/iot-analytics
```

### 3. Symbolic Link'i Kaldırın (eğer varsa)
```bash
sudo rm /etc/nginx/sites-enabled/iot-analytics
```

### 4. Nginx'i Test Edin
```bash
sudo nginx -t
```

### 5. Nginx'i Yeniden Yükleyin
```bash
sudo systemctl reload nginx
```

## 🔄 Alternatif: Dosyayı Yeniden Oluştur

Dosyayı silmek yerine, içeriğini temizleyip yeniden yazmak daha iyi olabilir:

```bash
sudo nano /etc/nginx/sites-available/iot-analytics
```

Sonra doğru içeriği yapıştırın (NGINX_HTTP_FIX.md dosyasındaki gibi).

