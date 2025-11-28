#include <DHT.h> 
#include <ESP8266WiFi.h>

// ============================================
// YAPILANDIRMA - Buraya kendi bilgilerinizi girin
// ============================================

// WiFi Ayarları
const char *ssid = "b";              // WiFi SSID
const char *pass = "12345678";          // WiFi Şifre

// API Ayarları - Dashboard'dan aldığınız bilgiler
String apiKey = "C575899C0317A2444FE947C8A8452064";    // Dashboard'dan channel oluşturduktan sonra API key'i buraya yapıştırın
const char* server = "iot.devrekbenimmarketim.com";  // Subdomain
const int serverPort = 80;              // HTTP için 80

// API Key kontrolü
void checkApiKey() {
    if (apiKey == "YOUR_API_KEY_HERE" || apiKey.length() < 10) {
        Serial.println("⚠⚠⚠ UYARI: API Key ayarlanmamış! ⚠⚠⚠");
        Serial.println("Lütfen dashboard'dan API key'i alıp kodda güncelleyin.");
        Serial.println("API Key olmadan veri gönderilemez!\n");
    }
}

// Sensör Pin Tanımlamaları
#define DHTPIN 5        // DHT sinyal pin (D1 = GPIO 5)
#define DHTTYPE DHT11   // DHT sensör tipi
#define GAS_PIN A0      // Gaz sensörü analog pin (A0)
#define BUZZER_PIN 13   // Buzzer/LED pin (D7 = GPIO 13)

// Eşik Değerleri
#define TEMP_THRESHOLD 30.0  // Sıcaklık eşik değeri
#define GAS_THRESHOLD 200    // Gaz eşik değeri (analog okuma)

// ============================================
// Değişkenler
// ============================================
DHT dht(DHTPIN, DHTTYPE);
WiFiClient client;

unsigned long lastUpdate = 0;
const unsigned long updateInterval = 500; // 0.5 saniye (gerçek zamanlı anlık veri takibi)

// ============================================
// SETUP
// ============================================
void setup() {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);  // Başlangıçta buzzer kapalı
    
    Serial.begin(115200);
    delay(100);
    Serial.println("\n\n=================================");
    Serial.println("IoT Analytics - ESP8266 Client");
    Serial.println("DHT11 + Gaz Sensörü");
    Serial.println("=================================\n");
    
    // DHT sensörü başlat
    dht.begin();
    Serial.println("✓ DHT11 sensörü başlatıldı");
    Serial.println("✓ Gaz sensörü hazır (A0)");
    Serial.println("✓ Buzzer hazır (D7 = GPIO 13)");
    Serial.println("\n🔊 Buzzer Bağlantısı:");
    Serial.println("   (+) Pozitif → D7 (GPIO 13)");
    Serial.println("   (-) Negatif → GND");
    Serial.println("");
    
    // API Key kontrolü
    checkApiKey();
    
    // WiFi'ye bağlan
    connectWiFi();
}

// ============================================
// WiFi Bağlantısı
// ============================================
void connectWiFi() {
    Serial.print("WiFi'ye bağlanılıyor: ");
    Serial.println(ssid);
    
    WiFi.begin(ssid, pass);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✓ WiFi bağlantısı başarılı!");
        Serial.print("IP Adresi: ");
        Serial.println(WiFi.localIP());
        Serial.print("Sinyal Gücü: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm\n");
    } else {
        Serial.println("\n✗ WiFi bağlantısı başarısız!");
        Serial.println("Lütfen SSID ve şifreyi kontrol edin.");
    }
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
    // WiFi bağlantısını kontrol et
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("⚠ WiFi bağlantısı kesildi, yeniden bağlanılıyor...");
        connectWiFi();
        return;
    }
    
    // 0.5 saniyede bir veri gönder (gerçek zamanlı anlık veri takibi)
    unsigned long currentMillis = millis();
    if (currentMillis - lastUpdate >= updateInterval) {
        lastUpdate = currentMillis;
        
        // Sensörlerden veri oku
        float h = dht.readHumidity();
        float t = dht.readTemperature();
        float gas = analogRead(GAS_PIN);
        
        // Veri geçerliliğini kontrol et
        if (isnan(h) || isnan(t)) {
            Serial.println("✗ DHT sensör okuma hatası!");
            return;
        }
        
        if (isnan(gas)) {
            Serial.println("✗ Gaz sensörü okuma hatası!");
            return;
        }
        
        // Verileri ekrana yazdır
        Serial.println("─────────────────────────────────");
        Serial.print("🌡️  Sıcaklık: ");
        Serial.print(t, 2);
        Serial.println(" °C");
        Serial.print("💧 Nem: ");
        Serial.print(h, 2);
        Serial.println(" %");
        Serial.print("💨 Gaz Seviyesi: ");
        Serial.print(gas, 0);
        Serial.println(" (analog)");
        
        // Uyarı kontrolleri
        bool tempWarning = t > TEMP_THRESHOLD;
        bool gasWarning = gas > GAS_THRESHOLD;
        
        if (tempWarning) {
            Serial.println("🔔 UYARI: Sıcaklık eşik değerinin üzerinde!");
        }
        
        // Buzzer kontrolü - DÜZELTİLDİ: Gaz > 200 ise buzzer AÇIK
        if (gasWarning) {
            Serial.println("🚨 ALARM: Gaz algılandı!!!");
            Serial.println("🔊 Buzzer AÇIK");
            digitalWrite(BUZZER_PIN, HIGH);  // Buzzer AÇIK (HIGH = açık)
        } else {
            digitalWrite(BUZZER_PIN, LOW);   // Buzzer KAPALI (LOW = kapalı)
        }
        
        // API'ye veri gönder
        sendDataToAPI(t, h, gas);
        
        Serial.println("─────────────────────────────────\n");
    }
}

// ============================================
// API'ye Veri Gönderimi
// ============================================
void sendDataToAPI(float temperature, float humidity, float gas) {
    // API Key kontrolü
    if (apiKey == "YOUR_API_KEY_HERE" || apiKey.length() < 10) {
        Serial.println("✗ HATA: API Key ayarlanmamış!");
        Serial.println("Lütfen dashboard'dan API key'i alıp kodda güncelleyin.\n");
        return;
    }
    
    Serial.print("📡 API'ye bağlanılıyor: ");
    Serial.print(server);
    Serial.print(":");
    Serial.println(serverPort);
    
    // Bağlantı timeout'u
    unsigned long connectTimeout = millis();
    while (!client.connect(server, serverPort)) {
        if (millis() - connectTimeout > 10000) {
            Serial.println("✗ Sunucuya bağlanılamadı! (10 saniye timeout)");
            Serial.println("Kontrol edin:");
            Serial.println("  - WiFi bağlantısı aktif mi?");
            Serial.println("  - Domain adresi doğru mu?");
            Serial.println("  - Sunucu çalışıyor mu?\n");
            return;
        }
        delay(100);
    }
    
    Serial.println("✓ Sunucuya bağlandı");
    
    // POST body oluştur (3 field: sıcaklık, nem, gaz)
    String postData = "field1=" + String(temperature, 2) + 
                     "&field2=" + String(humidity, 2) + 
                     "&field3=" + String(gas, 0);
    
    Serial.print("📤 Gönderilen veri: ");
    Serial.println(postData);
    Serial.print("🔑 API Key: ");
    Serial.println(apiKey);
    
    // HTTP POST request
    client.println("POST /update HTTP/1.1");
    client.print("Host: ");
    client.println(server);
    client.println("Connection: close");
    client.print("X-THINGSPEAKAPIKEY: ");
    client.println(apiKey);
    client.println("Content-Type: application/x-www-form-urlencoded");
    client.print("Content-Length: ");
    client.println(postData.length());
    client.println(); // Boş satır (header'ların sonu)
    client.println(postData);
    
    Serial.println("✓ HTTP request gönderildi");
    
    // Sunucu yanıtını bekle ve oku
    unsigned long timeout = millis();
    while (client.available() == 0) {
        if (millis() - timeout > 10000) {
            Serial.println("⚠ Sunucu yanıt vermedi (10 saniye timeout)");
            client.stop();
            return;
        }
        delay(10);
    }
    
    Serial.println("📥 Sunucu yanıtı alınıyor...");
    
    // Response'u oku
    String response = "";
    bool headersEnded = false;
    int statusCode = 0;
    
    while (client.available() || client.connected()) {
        if (client.available()) {
            String line = client.readStringUntil('\n');
            line.trim();
            
            // HTTP status line'ı oku
            if (line.startsWith("HTTP/")) {
                int firstSpace = line.indexOf(' ');
                int secondSpace = line.indexOf(' ', firstSpace + 1);
                if (firstSpace > 0 && secondSpace > 0) {
                    statusCode = line.substring(firstSpace + 1, secondSpace).toInt();
                    Serial.print("📊 HTTP Status: ");
                    Serial.println(statusCode);
                }
            }
            
            // Header'ların sonu (boş satır)
            if (line.length() == 0) {
                headersEnded = true;
                continue;
            }
            
            // Body'yi oku
            if (headersEnded && line.length() > 0) {
                response += line;
            }
        } else {
            delay(10);
        }
    }
    
    // Yanıtı göster
    if (response.length() > 0) {
        Serial.print("✅ Başarılı! Entry ID: ");
        Serial.println(response);
    } else if (statusCode == 200) {
        Serial.println("✅ Veri başarıyla gönderildi!");
    } else if (statusCode == 401 || statusCode == 403) {
        Serial.println("❌ HATA: Geçersiz API Key!");
        Serial.println("Lütfen dashboard'dan doğru API key'i alıp güncelleyin.");
    } else if (statusCode > 0) {
        Serial.print("⚠ UYARI: HTTP Status ");
        Serial.println(statusCode);
    }
    
    client.stop();
    Serial.println("✓ Bağlantı kapatıldı\n");
}

// ============================================
// Yardımcı Fonksiyonlar
// ============================================

// Hata durumunda buzzer ile uyarı (3 kısa bip)
void errorBlink() {
    Serial.println("🔊 Hata uyarısı - 3 kısa bip");
    for (int i = 0; i < 3; i++) {
        digitalWrite(BUZZER_PIN, HIGH);  // Buzzer açık
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);   // Buzzer kapalı
        delay(100);
    }
}
