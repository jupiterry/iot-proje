#include <DHT.h> 
#include <ESP8266WiFi.h>

// ============================================
// YAPILANDIRMA - Buraya kendi bilgilerinizi girin
// ============================================

// WiFi Ayarları
const char *ssid = "Emirhan2";              // WiFi SSID
const char *pass = "123456789";          // WiFi Şifre

// API Ayarları - Dashboard'dan aldığınız bilgiler
String apiKey = "C2B48A621DA7D9F7EBA4BFA4A8CAAE7F";    // Dashboard'dan channel oluşturduktan sonra API key'i buraya yapıştırın
const char* server = "iot.devrekbenimmarketim.com";  // Subdomain (HTTP için 80, HTTPS için 443)
const int serverPort = 80;              // HTTP için 80, HTTPS için 443

// API Key kontrolü
void checkApiKey() {
    if (apiKey == "YOUR_API_KEY_HERE" || apiKey.length() < 10) {
        Serial.println("⚠⚠⚠ UYARI: API Key ayarlanmamış! ⚠⚠⚠");
        Serial.println("Lütfen dashboard'dan API key'i alıp kodda güncelleyin.");
        Serial.println("API Key olmadan veri gönderilemez!\n");
    }
}

// DHT Sensör Ayarları
#define DHTPIN 5        // DHT sinyal pin (D1 = GPIO 5)
#define DHTTYPE DHT11   // DHT sensör tipi
#define BUZZER_PIN 14   // Buzzer pin (D5 = GPIO 14)

// Sıcaklık eşik değeri (buzzer için)
#define TEMP_THRESHOLD 30.0

// ============================================
// Değişkenler
// ============================================
DHT dht(DHTPIN, DHTTYPE);
WiFiClient client;

unsigned long lastUpdate = 0;
const unsigned long updateInterval = 15000; // 15 saniye (ThingSpeak minimum)

// ============================================
// SETUP
// ============================================
void setup() {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    
    Serial.begin(115200);
    delay(100);
    Serial.println("\n\n=================================");
    Serial.println("IoT Analytics - ESP8266 Client");
    Serial.println("=================================\n");
    
    // DHT sensörü başlat
    dht.begin();
    Serial.println("✓ DHT11 sensörü başlatıldı");
    
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
    
    // 15 saniyede bir veri gönder
    unsigned long currentMillis = millis();
    if (currentMillis - lastUpdate >= updateInterval) {
        lastUpdate = currentMillis;
        
        // Sensörden veri oku
        float h = dht.readHumidity();
        float t = dht.readTemperature();
        
        // Veri geçerliliğini kontrol et
        if (isnan(h) || isnan(t)) {
            Serial.println("✗ DHT sensör okuma hatası!");
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
        
        // Buzzer kontrolü
        if (t > TEMP_THRESHOLD) {
            digitalWrite(BUZZER_PIN, HIGH);
            Serial.println("🔔 UYARI: Sıcaklık eşik değerinin üzerinde!");
            Serial.println("🔔 Buzzer AÇIK");
        } else {
            digitalWrite(BUZZER_PIN, LOW);
        }
        
        // API'ye veri gönder
        sendDataToAPI(t, h);
        
        Serial.println("─────────────────────────────────\n");
    }
}

// ============================================
// API'ye Veri Gönderimi
// ============================================
void sendDataToAPI(float temperature, float humidity) {
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
    
    // POST body oluştur (2 ondalık basamak)
    String postData = "field1=" + String(temperature, 2) + "&field2=" + String(humidity, 2);
    
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

// Hata durumunda buzzer ile uyarı
void errorBlink() {
    for (int i = 0; i < 3; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
    }
}
