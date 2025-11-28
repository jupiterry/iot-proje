const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './iot_data.sqlite';

class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Veritabanı bağlantı hatası:', err.message);
            } else {
                console.log('✓ SQLite veritabanına bağlanıldı:', DB_PATH);
                this.initTables();
            }
        });
    }

    initTables() {
        // Channels tablosu
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
            } else {
                console.log('✓ Channels tablosu hazır');
                
                // Alarm threshold kolonu yoksa ekle (migration)
                this.db.run(`
                    ALTER TABLE channels ADD COLUMN gas_alarm_threshold FLOAT DEFAULT 200
                `, (err) => {
                    // Hata vermesi normal (kolon zaten varsa)
                    if (!err) {
                        console.log('✓ Alarm threshold kolonu eklendi');
                    }
                });
            }
        });

        // Feeds tablosu
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
            } else {
                console.log('✓ Feeds tablosu hazır');
            }
        });

        // Index oluştur (performans için)
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_feeds_channel_id ON feeds(channel_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_feeds_created_at ON feeds(created_at)`);
    }

    // Promise wrapper for better async/await support
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
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
