const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './iot_data.sqlite';

class Database {
    constructor() {
        this.initialized = false;
        this.initPromise = null;
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Veritabanı bağlantı hatası:', err.message);
            } else {
                console.log('✓ SQLite veritabanına bağlanıldı:', DB_PATH);
                this.initPromise = this.initTables();
            }
        });
    }

    async ensureInitialized() {
        if (this.initialized) return;
        if (this.initPromise) {
            await this.initPromise;
        } else {
            // If initPromise is not set yet, wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 100));
            if (this.initPromise) {
                await this.initPromise;
            } else {
                // Force initialization if not started
                this.initPromise = this.initTables();
                await this.initPromise;
            }
        }
    }

    async initTables() {
        if (this.initialized) return;
        
        try {
            // Channels tablosu - önce bunu oluştur
            await new Promise((resolve, reject) => {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS channels (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        api_key VARCHAR(32) UNIQUE NOT NULL,
                        field1_name VARCHAR(50) DEFAULT 'Field 1',
                        field2_name VARCHAR(50) DEFAULT 'Field 2',
                        field3_name VARCHAR(50) DEFAULT 'Field 3',
                        field4_name VARCHAR(50) DEFAULT 'Field 4',
                        gas_alarm_threshold FLOAT DEFAULT 200,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Channels tablosu oluşturma hatası:', err.message);
                        reject(err);
                    } else {
                        console.log('✓ Channels tablosu hazır');
                        resolve();
                    }
                });
            });

            // Alarm threshold kolonu yoksa ekle (migration) - hata olursa ignore et
            await new Promise((resolve) => {
                this.db.run(`
                    ALTER TABLE channels ADD COLUMN gas_alarm_threshold FLOAT DEFAULT 200
                `, (err) => {
                    // Hata vermesi normal (kolon zaten varsa)
                    if (!err) {
                        console.log('✓ Alarm threshold kolonu eklendi');
                    }
                    resolve();
                });
            });

            // Feeds tablosu - channels'tan sonra oluştur
            await new Promise((resolve, reject) => {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS feeds (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        channel_id INTEGER NOT NULL,
                        field1 FLOAT,
                        field2 FLOAT,
                        field3 FLOAT,
                        field4 FLOAT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
                    )
                `, (err) => {
                    if (err) {
                        console.error('Feeds tablosu oluşturma hatası:', err.message);
                        reject(err);
                    } else {
                        console.log('✓ Feeds tablosu hazır');
                        resolve();
                    }
                });
            });

            // Index oluştur (performans için)
            await new Promise((resolve) => {
                this.db.run(`CREATE INDEX IF NOT EXISTS idx_feeds_channel_id ON feeds(channel_id)`, (err) => {
                    if (!err) console.log('✓ Index: idx_feeds_channel_id oluşturuldu');
                    resolve();
                });
            });

            await new Promise((resolve) => {
                this.db.run(`CREATE INDEX IF NOT EXISTS idx_feeds_created_at ON feeds(created_at)`, (err) => {
                    if (!err) console.log('✓ Index: idx_feeds_created_at oluşturuldu');
                    resolve();
                });
            });

            this.initialized = true;
            console.log('✓ Veritabanı tabloları başarıyla hazırlandı');
        } catch (error) {
            console.error('Veritabanı başlatma hatası:', error);
            throw error;
        }
    }

    // Promise wrapper for better async/await support
    async run(sql, params = []) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async get(sql, params = []) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async all(sql, params = []) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = new Database();
