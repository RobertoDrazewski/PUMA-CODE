const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rutas
const aiRoutes = require('./routes/aiRoutes'); 

const app = express();

// --- MIDDLEWARES ---

// 1. Configuración de CORS Blindada
app.use(cors({
    origin: '*', // Permite peticiones desde cualquier origen (ideal para pruebas móviles)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// 2. Procesamiento de cuerpos de petición (JSON + TEXTO PLANO)
app.use(express.json()); 
// Este es vital por si el móvil envía datos como texto plano para evitar el "Pre-flight"
app.use(express.text({ type: "text/plain" })); 

// 3. Middleware para convertir texto plano a JSON si es necesario
app.use((req, res, next) => {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) {
            console.error("Error parseando body de texto plano:", e);
        }
    }
    next();
});

// --- DEFINICIÓN DE RUTAS ---
app.use('/api/ai', aiRoutes); 

// Ruta de salud del servidor
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

// 4. Aumentar el Timeout del servidor (Vital para procesos de IA largos)
// Evita que Render o el servidor corten la conexión antes de 120 segundos
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;