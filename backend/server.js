const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- RUTAS REPARADAS ---
// Se agrega './src/' para coincidir con tu estructura de carpetas
const aiRoutes = require('./src/routes/aiRoutes'); 

const app = express();

// --- MIDDLEWARES ---

// 1. Configuración de CORS Blindada
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// 2. Procesamiento de cuerpos de petición
app.use(express.json()); 
app.use(express.text({ type: "text/plain", limit: '10mb' })); 

// 3. Middleware de Conversión Automática (Optimizado)
app.use((req, res, next) => {
    if (req.body && typeof req.body === 'string' && req.body.trim().startsWith('{')) {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) {
            console.error("⚠️ Error parseando body de texto plano:", e.message);
        }
    }
    next();
});

// --- DEFINICIÓN DE RUTAS ---
app.use('/api/ai', aiRoutes); 

// Ruta de salud del servidor (Health Check)
app.get('/', (req, res) => {
    res.status(200).send('🐆 Puma Code API is running smoothly...');
});

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
    console.error('❌ SERVER ERROR:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Algo salió mal en el servidor de Puma Code',
        details: err.message 
    });
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000; 

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log(`🚀 Puma Code Server ready on port ${PORT}`);
    console.log('-------------------------------------------');
});

// 4. Configuración de Tiempos de Espera (Indispensable para Render + IA)
server.keepAliveTimeout = 120000; 
server.headersTimeout = 125000;