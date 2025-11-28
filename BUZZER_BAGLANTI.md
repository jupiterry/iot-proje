# 🔊 Buzzer Bağlantı Rehberi - ESP8266

## 📌 Pin Bilgileri

Kodda buzzer/LED için **GPIO 13 (D7)** kullanılıyor.

### ESP8266 NodeMCU Pin Haritası:
- **GPIO 13** = **D7** (Digital Pin 7)
- **GPIO 5** = **D1** (DHT11 sensörü için)
- **A0** = Analog pin (Gaz sensörü için)

## 🔌 Buzzer Bağlantı Şeması

### Yöntem 1: Pasif Buzzer (Önerilen)

```
ESP8266          Buzzer
-------          ------
GPIO 13 (D7) ----[+] Pozitif
GND          ----[-] Negatif
```

**Not:** Pasif buzzer doğrudan bağlanabilir ama daha iyi kontrol için:

```
ESP8266          Transistor          Buzzer
-------          ----------          ------
GPIO 13 (D7) ----[B]  NPN  [C]------[+] Pozitif
                              [E]------ GND
                    [E]--------------- GND
GND          -------------------------[-] Negatif
```

### Yöntem 2: Aktif Buzzer (Basit)

```
ESP8266          Buzzer
-------          ------
GPIO 13 (D7) ----[+] Pozitif (Kırmızı kablo)
GND          ----[-] Negatif (Siyah kablo)
```

**Önemli:** Aktif buzzer dirençle kullanılmalı (220Ω-1kΩ)

### Yöntem 3: LED ile (Test için)

Buzzer yoksa LED kullanabilirsiniz:

```
ESP8266          LED
-------          ---
GPIO 13 (D7) ----[+] Anot (Uzun bacak)
GND          ----[-] Katot (Kısa bacak)
+ 220Ω Direnç (LED'i korumak için)
```

## 🛠️ Detaylı Bağlantı

### Bileşenler:
1. **Pasif Buzzer** (5V) - Önerilen
2. **220Ω Direnç** (LED kullanıyorsanız)
3. **Jumper kablolar**

### Adım Adım:

#### 1. Buzzer'i Hazırlayın
- Pasif buzzer'in pozitif (+) ve negatif (-) uçlarını belirleyin
- Genellikle + işareti veya daha uzun bacak pozitiftir

#### 2. ESP8266'ya Bağlayın
```
Buzzer (+)  →  GPIO 13 (D7)
Buzzer (-)  →  GND
```

#### 3. Kodu Yükleyin
- Arduino IDE'de kodu yükleyin
- Serial Monitor'dan test edin

## 🔧 Kod Ayarı

Kodda buzzer pin tanımı:

```cpp
#define LED_PIN 13  // D7 = GPIO 13
```

**Farklı bir pin kullanmak isterseniz:**
- D4 için: `#define LED_PIN 2` (GPIO 2)
- D5 için: `#define LED_PIN 14` (GPIO 14)
- D6 için: `#define LED_PIN 12` (GPIO 12)

## ⚡ Çalışma Mantığı

1. **Normal Durum:** GPIO 13 LOW (buzzer kapalı)
2. **Gaz Algılandığında:** GPIO 13 HIGH (buzzer açık)
3. **Gaz Normal:** GPIO 13 LOW (buzzer kapalı)

Kodda:
```cpp
if (gas > GAS_THRESHOLD) {  // 400'den büyükse
    digitalWrite(LED_PIN, HIGH);  // Buzzer AÇIK
} else {
    digitalWrite(LED_PIN, LOW);   // Buzzer KAPALI
}
```

## 🧪 Test

### Serial Monitor'dan Test:
1. Serial Monitor'u açın (115200 baud)
2. Gaz değeri 400'ün üzerine çıktığında buzzer çalışmalı
3. Gaz değeri normale döndüğünde buzzer durmalı

### Manuel Test:
Kod ekleyerek test edebilirsiniz:
```cpp
void setup() {
    // ... mevcut kod ...
    
    // Test: Buzzer'i aç
    digitalWrite(LED_PIN, HIGH);
    delay(1000);
    digitalWrite(LED_PIN, LOW);
}
```

## ⚠️ Önemli Notlar

1. **Pasif Buzzer Kullanın:** Aktif buzzer ile ses tonu değiştirilemez
2. **Direnç Gerekli Değil:** ESP8266 GPIO çıkışı 3.3V, çoğu buzzer için yeterli
3. **Aşırı Akım:** Buzzer 20mA'den fazla çekiyorsa transistor kullanın
4. **5V Buzzer:** 5V buzzer kullanıyorsanız level shifter veya transistor gerekir

## 🔧 Alternatif: Ses Tonu Kontrolü (Gelişmiş)

Ses tonu değiştirmek isterseniz:

```cpp
#include <ESP8266WiFi.h>
#include <DHT.h>

// ... mevcut kod ...

void alarmTone() {
    // Farklı tonlarda bip sesi
    for (int i = 0; i < 5; i++) {
        for (int freq = 500; freq < 2000; freq += 100) {
            tone(LED_PIN, freq, 50);  // tone() kullanımı
            delay(50);
        }
    }
}

void loop() {
    // ... mevcut kod ...
    
    if (gasWarning) {
        alarmTone();  // Ses tonlu alarm
    }
}
```

**Not:** `tone()` fonksiyonu ESP8266'da farklı kütüphane gerektirebilir.

## 📝 Özet

✅ **Buzzer Bağlantısı:**
- Buzzer (+) → GPIO 13 (D7)
- Buzzer (-) → GND

✅ **Kod:**
- Pin tanımı: `#define LED_PIN 13`
- Otomatik çalışır (gas > 400)

✅ **Test:**
- Serial Monitor'dan gaz değerini kontrol edin
- 400'ün üzerine çıktığında buzzer çalışmalı

## 🆘 Sorun Giderme

### Buzzer Çalışmıyor:
1. Pin bağlantısını kontrol edin
2. Buzzer'in çalışıp çalışmadığını 9V pil ile test edin
3. Serial Monitor'da gaz değerini kontrol edin
4. Kodda pin numarasını kontrol edin

### Çok Zayıf Ses:
- Daha güçlü buzzer kullanın
- Transistor ile amplifikasyon ekleyin
- 5V yerine 12V buzzer kullanın (transistor ile)

### Sürekli Çalışıyor:
- Gaz değeri sürekli 400'ün üzerinde
- GAS_THRESHOLD değerini artırın: `#define GAS_THRESHOLD 500`

## 🎯 Hızlı Başlangıç

1. **Buzzer'i alın** (Pasif 5V)
2. **Bağlayın:**
   - Kırmızı/uzun bacak → D7 (GPIO 13)
   - Siyah/kısa bacak → GND
3. **Kodu yükleyin**
4. **Test edin!** 🎉

