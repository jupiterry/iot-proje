#!/usr/bin/env node
/**
 * Veritabanı başlatma scripti
 * Bu script veritabanı tablolarını oluşturmak için kullanılabilir
 * 
 * Kullanım: node init-database.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './iot_data.sqlite';

console.log('🔧 Veritabanı başlatılıyor...');
console.log(`📁 Veritabanı yolu: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Veritabanı bağlantı hatası:', err.message);
        process.exit(1);
    } else {
        console.log('✓ SQLite veritabanına bağlanıldı');
        initTables();
    }
});

function initTables() {
    // Channels tablosu
    db.run(`
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
            console.error('❌ Channels tablosu oluşturma hatası:', err.message);
            console.log('⚠️  Devam ediliyor (tablo zaten mevcut olabilir)...');
        } else {
            console.log('✓ Channels tablosu hazır');
        }
        
        // Alarm threshold kolonu yoksa ekle (migration)
        db.run(`
            ALTER TABLE channels ADD COLUMN gas_alarm_threshold FLOAT DEFAULT 200
        `, (err) => {
            if (!err) {
                console.log('✓ Alarm threshold kolonu eklendi (veya zaten mevcut)');
            }
            // Hata olması normal (kolon zaten varsa), feeds tablosuna geç
            createFeedsTable();
        });
    });
}

function createFeedsTable() {
    // Feeds tablosu
    db.run(`
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
            console.error('❌ Feeds tablosu oluşturma hatası:', err.message);
            db.close();
            process.exit(1);
        } else {
            console.log('✓ Feeds tablosu hazır');
            createIndexes();
        }
    });
}

function createIndexes() {
    // Index'leri oluştur
    db.run(`CREATE INDEX IF NOT EXISTS idx_feeds_channel_id ON feeds(channel_id)`, (err) => {
        if (!err) {
            console.log('✓ Index: idx_feeds_channel_id oluşturuldu');
        }
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_feeds_created_at ON feeds(created_at)`, (err) => {
            if (!err) {
                console.log('✓ Index: idx_feeds_created_at oluşturuldu');
            }
            
            // Tabloları kontrol et
            checkTables();
        });
    });
}

function checkTables() {
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, rows) => {
        if (err) {
            console.error('❌ Tablo kontrolü hatası:', err.message);
            db.close();
            process.exit(1);
        } else {
            console.log('\n📊 Mevcut tablolar:');
            rows.forEach(row => {
                console.log(`   - ${row.name}`);
            });
            
            db.close((err) => {
                if (err) {
                    console.error('❌ Veritabanı kapatma hatası:', err.message);
                    process.exit(1);
                } else {
                    console.log('\n✅ Veritabanı başlatma tamamlandı!');
                    process.exit(0);
                }
            });
        }
    });
}

