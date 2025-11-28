const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// CORS - VPS'den erişim için
app.use(cors());

// Body parser - JSON ve URL-encoded data için
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files - Dashboard için
app.use(express.static(path.join(__dirname, 'public')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// Routes
// ============================================

// API routes
app.use('/', apiRoutes);

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Sunucu hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
});

// ============================================
// Server Start
// ============================================

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 IoT Analytics Platform Başlatıldı!');
    console.log('='.repeat(50));
    console.log(`📡 Server çalışıyor: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 API Endpoint: http://localhost:${PORT}/update`);
    console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️  Sunucu kapatılıyor...');
    await db.close();
    process.exit(0);
});
