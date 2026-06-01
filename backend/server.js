const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rutas
const aiRoutes = require('./routes/aiRoutes'); 

const app = express();

// --- MIDDLEWARES ---

// 1. Configuración de CORS Blindada (Soporte total para móviles y navegadores)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// 2. Procesamiento de cuerpos de petición (JSON + TEXTO PLANO)
// express.json() para PC y peticiones estándar
app.use(express.json()); 
// express.text() es el "truco" para que los móviles envíen datos sin ser bloqueados
app.use(express.text({ type: "text/plain", limit: '10mb' })); 

// 3. Middleware de Conversión Automática
// Si el móvil envía los datos como texto plano para evitar el Pre-flight, 
// este middleware los convierte en objeto JSON antes de llegar a tus rutas.
app.use((req, res, next) => {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
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

// 4. Configuración de Tiempos de Espera (Indispensable para Render + IA)
// Esto evita que la conexión se cierre mientras OpenAI procesa el análisis
server.keepAliveTimeout = 120000; // 120 segundos
server.headersTimeout = 125000;   // 125 segundos