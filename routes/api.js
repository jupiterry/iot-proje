const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const Feed = require('../models/Feed');

// ============================================
// ThingSpeak Uyumlu API Endpoints
// ============================================

// POST /update - Veri gönderimi (ESP8266'dan)
router.post('/update', async (req, res) => {
    try {
        // API key header'dan veya query'den al
        const apiKey = req.headers['x-thingspeakapikey'] || req.query.api_key;

        if (!apiKey) {
            return res.status(401).json({ error: 'API key gerekli' });
        }

        // Channel'ı API key ile bul
        const channel = await Channel.findByApiKey(apiKey);
        if (!channel) {
            return res.status(403).json({ error: 'Geçersiz API key' });
        }

        // Field verilerini al
        const feedData = {
            field1: req.body.field1 || null,
            field2: req.body.field2 || null,
            field3: req.body.field3 || null,
            field4: req.body.field4 || null
        };

        // Feed oluştur
        const feed = await Feed.create(channel.id, feedData);

        // ThingSpeak uyumlu response (entry_id döndür)
        // Hızlı yanıt için hemen gönder (async işlemler beklemeden)
        res.status(200).send(feed.id.toString());

        // Log'u arka planda yap (performans için)
        setImmediate(() => {
            console.log(`✓ Veri alındı - Channel: ${channel.name}, ID: ${feed.id}`);
        });
    } catch (error) {
        console.error('Update hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /channels/:channelId/feeds.json - Veri okuma
router.get('/channels/:channelId/feeds.json', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { results, start, end } = req.query;

        // Channel'ı kontrol et
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel bulunamadı' });
        }

        // Feed'leri getir
        const feeds = await Feed.findByChannelId(channelId, {
            results: results || 100,
            start,
            end
        });

        // ThingSpeak uyumlu JSON response
        res.json({
            channel: {
                id: channel.id,
                name: channel.name,
                description: channel.description,
                api_key: channel.api_key,
                field1: channel.field1_name,
                field2: channel.field2_name,
                field3: channel.field3_name,
                field4: channel.field4_name,
                gas_alarm_threshold: channel.gas_alarm_threshold || 200,
                created_at: channel.created_at,
                updated_at: channel.updated_at
            },
            feeds: feeds
        });
    } catch (error) {
        console.error('Feeds getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /channels/:channelId/feeds/last.json - Son veriyi al
router.get('/channels/:channelId/feeds/last.json', async (req, res) => {
    try {
        const { channelId } = req.params;

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel bulunamadı' });
        }

        const feed = await Feed.getLatest(channelId);

        res.json({
            channel: {
                id: channel.id,
                name: channel.name
            },
            feed: feed || {}
        });
    } catch (error) {
        console.error('Son feed getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ============================================
// Channel Yönetimi API Endpoints
// ============================================

// POST /channels - Yeni channel oluştur
router.post('/channels', async (req, res) => {
    try {
        const channel = await Channel.create(req.body);
        res.status(201).json(channel);
        console.log(`✓ Yeni channel oluşturuldu: ${channel.name} (API Key: ${channel.api_key})`);
    } catch (error) {
        console.error('Channel oluşturma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /channels - Tüm channel'ları listele
router.get('/channels', async (req, res) => {
    try {
        const channels = await Channel.findAll();
        res.json(channels);
    } catch (error) {
        console.error('Channel listesi hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /channels/:id - Tek channel getir
router.get('/channels/:id', async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Channel bulunamadı' });
        }
        // gas_alarm_threshold varsa ekle, yoksa 200 default
        channel.gas_alarm_threshold = channel.gas_alarm_threshold || 200;
        res.json(channel);
    } catch (error) {
        console.error('Channel getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PUT /channels/:id - Channel güncelle
router.put('/channels/:id', async (req, res) => {
    try {
        const channel = await Channel.update(req.params.id, req.body);
        res.json(channel);
        console.log(`✓ Channel güncellendi: ${channel.name}`);
    } catch (error) {
        console.error('Channel güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// DELETE /channels/:id - Channel sil
router.delete('/channels/:id', async (req, res) => {
    try {
        await Channel.delete(req.params.id);
        res.json({ message: 'Channel silindi' });
        console.log(`✓ Channel silindi: ${req.params.id}`);
    } catch (error) {
        console.error('Channel silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /channels/:id/stats - Channel istatistikleri
router.get('/channels/:id/stats', async (req, res) => {
    try {
        const field = req.query.field || 'field1';
        const stats = await Feed.getStats(req.params.id, field);
        res.json(stats);
    } catch (error) {
        console.error('İstatistik hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PUT /channels/:id/alarm-threshold - Gaz alarm eşik değerini güncelle
router.put('/channels/:id/alarm-threshold', async (req, res) => {
    try {
        const { id } = req.params;
        const { threshold } = req.body;
        
        if (threshold === undefined || threshold === null) {
            return res.status(400).json({ error: 'Threshold değeri gerekli' });
        }
        
        const thresholdValue = parseFloat(threshold);
        if (isNaN(thresholdValue) || thresholdValue < 0) {
            return res.status(400).json({ error: 'Geçerli bir sayı girin (0 veya daha büyük)' });
        }
        
        const channel = await Channel.updateAlarmThreshold(id, thresholdValue);
        res.json(channel);
        console.log(`✓ Alarm threshold güncellendi - Channel: ${channel.name}, Threshold: ${thresholdValue}`);
    } catch (error) {
        console.error('Alarm threshold güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
