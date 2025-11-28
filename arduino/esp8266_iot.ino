#include <DHT.h> 
#include <ESP8266WiFi.h>

// ============================================
// YAPILANDIRMA - Buraya kendi bilgilerinizi girin
// ============================================

// WiFi Ayarları
const char *ssid = "Emre";              // WiFi SSID
const char *pass = "Emre1234";          // WiFi Şifre

// API Ayarları - Dashboard'dan aldığınız bilgiler
String apiKey = "YOUR_API_KEY_HERE";    // Dashboard'dan channel oluşturduktan sonra API key'i buraya yapıştırın
const char* server = "iot.devrekbenimmarketim.com";  // Subdomain (HTTP için 80, HTTPS için 443)
const int serverPort = 80;              // HTTP için 80, HTTPS için 443

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
        Serial.print(t);
        Serial.println(" °C");
        Serial.print("💧 Nem: ");
        Serial.print(h);
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
    Serial.print("📡 API'ye bağlanılıyor: ");
    Serial.print(server);
    Serial.print(":");
    Serial.println(serverPort);
    
    if (!client.connect(server, serverPort)) {
        Serial.println("✗ Sunucuya bağlanılamadı!");
        return;
    }
    
    Serial.println("✓ Sunucuya bağlandı");
    
    // POST body oluştur
    String postData = "field1=" + String(temperature) + "&field2=" + String(humidity);
    
    // HTTP POST request
    client.print("POST /update HTTP/1.1\r\n");
    client.print("Host: ");
    client.print(server);
    client.print("\r\n");
    client.print("Connection: close\r\n");
    client.print("X-THINGSPEAKAPIKEY: ");
    client.print(apiKey);
    client.print("\r\n");
    client.print("Content-Type: application/x-www-form-urlencoded\r\n");
    client.print("Content-Length: ");
    client.print(postData.length());
    client.print("\r\n\r\n");
    client.print(postData);
    
    Serial.println("✓ Veri gönderildi");
    
    // Sunucu yanıtını oku
    unsigned long timeout = millis();
    while (client.available() == 0) {
        if (millis() - timeout > 5000) {
            Serial.println("⚠ Sunucu yanıt vermedi (timeout)");
            client.stop();
            return;
        }
    }
    
    // Response'u oku
    bool headersEnded = false;
    while (client.available()) {
        String line = client.readStringUntil('\n');
        
        if (line == "\r") {
            headersEnded = true;
        } else if (headersEnded && line.length() > 0) {
            Serial.print("📥 Sunucu yanıtı: Entry ID = ");
            Serial.println(line);
        }
    }
    
    client.stop();
    Serial.println("✓ Bağlantı kapatıldı");
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
