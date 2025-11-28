const db = require('../database');

class Feed {
    // Yeni feed ekle (ThingSpeak uyumlu)
    static async create(channelId, data) {
        const { field1, field2, field3, field4 } = data;

        const sql = `
            INSERT INTO feeds (channel_id, field1, field2, field3, field4)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await db.run(sql, [
            channelId,
            field1 || null,
            field2 || null,
            field3 || null,
            field4 || null
        ]);

        return {
            id: result.id,
            channel_id: channelId,
            field1,
            field2,
            field3,
            field4
        };
    }

    // Channel için feed'leri getir (ThingSpeak API uyumlu)
    static async findByChannelId(channelId, options = {}) {
        const { results = 100, start, end } = options;

        let sql = 'SELECT * FROM feeds WHERE channel_id = ?';
        const params = [channelId];

        // Tarih aralığı filtresi
        if (start) {
            sql += ' AND created_at >= ?';
            params.push(start);
        }
        if (end) {
            sql += ' AND created_at <= ?';
            params.push(end);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(results));

        return await db.all(sql, params);
    }

    // Son feed'i getir
    static async getLatest(channelId) {
        const sql = `
            SELECT * FROM feeds 
            WHERE channel_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        return await db.get(sql, [channelId]);
    }

    // İstatistikler
    static async getStats(channelId, field = 'field1') {
        const sql = `
            SELECT 
                COUNT(*) as count,
                AVG(${field}) as average,
                MIN(${field}) as minimum,
                MAX(${field}) as maximum
            FROM feeds 
            WHERE channel_id = ? AND ${field} IS NOT NULL
        `;
        return await db.get(sql, [channelId]);
    }

    // Eski kayıtları temizle (opsiyonel)
    static async deleteOlderThan(channelId, days = 30) {
        const sql = `
            DELETE FROM feeds 
            WHERE channel_id = ? 
            AND created_at < datetime('now', '-' || ? || ' days')
        `;
        return await db.run(sql, [channelId, days]);
    }
}

module.exports = Feed;
