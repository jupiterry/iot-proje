const db = require('../database');
const crypto = require('crypto');

class Channel {
    // API key oluştur
    static generateApiKey() {
        return crypto.randomBytes(16).toString('hex').toUpperCase();
    }

    // Yeni channel oluştur
    static async create(data) {
        const apiKey = this.generateApiKey();
        const { name, description, field1_name, field2_name, field3_name, field4_name } = data;

        const sql = `
            INSERT INTO channels (name, description, api_key, field1_name, field2_name, field3_name, field4_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.run(sql, [
            name,
            description || '',
            apiKey,
            field1_name || 'Field 1',
            field2_name || 'Field 2',
            field3_name || 'Field 3',
            field4_name || 'Field 4'
        ]);

        return {
            id: result.id,
            name,
            description,
            api_key: apiKey,
            field1_name: field1_name || 'Field 1',
            field2_name: field2_name || 'Field 2',
            field3_name: field3_name || 'Field 3',
            field4_name: field4_name || 'Field 4'
        };
    }

    // Channel'ı ID ile bul
    static async findById(id) {
        const sql = 'SELECT * FROM channels WHERE id = ?';
        return await db.get(sql, [id]);
    }

    // Channel'ı API key ile bul
    static async findByApiKey(apiKey) {
        const sql = 'SELECT * FROM channels WHERE api_key = ?';
        return await db.get(sql, [apiKey]);
    }

    // Tüm channel'ları listele
    static async findAll() {
        const sql = 'SELECT * FROM channels ORDER BY created_at DESC';
        return await db.all(sql);
    }

    // Channel güncelle
    static async update(id, data) {
        const { name, description, field1_name, field2_name, field3_name, field4_name, gas_alarm_threshold } = data;

        const sql = `
            UPDATE channels 
            SET name = ?, description = ?, field1_name = ?, field2_name = ?, 
                field3_name = ?, field4_name = ?, 
                gas_alarm_threshold = COALESCE(?, gas_alarm_threshold),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await db.run(sql, [name, description, field1_name, field2_name, field3_name, field4_name, gas_alarm_threshold, id]);
        return await this.findById(id);
    }
    
    // Alarm threshold güncelle
    static async updateAlarmThreshold(id, threshold) {
        const sql = `
            UPDATE channels 
            SET gas_alarm_threshold = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await db.run(sql, [threshold, id]);
        return await this.findById(id);
    }

    // Channel sil
    static async delete(id) {
        const sql = 'DELETE FROM channels WHERE id = ?';
        return await db.run(sql, [id]);
    }
}

module.exports = Channel;
