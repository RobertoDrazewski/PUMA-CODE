const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rutas
const aiRoutes = require('./routes/aiRoutes'); 

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); // Vital para procesar los cuerpos de las peticiones

// --- DEFINICIÓN DE RUTAS ---
// Todas las rutas de IA empezarán con /api/ai
app.use('/api/ai', aiRoutes); 

// Ruta de salud del servidor (HTML simple para el navegador)
app.get('/', (req, res) => {
    res.status(200).send('🐆 Puma Code API is running smoothly...');
});

// --- MANEJO DE ERRORES GLOBAL ---
// Este bloque captura cualquier error que no hayas atrapado en los controladores
// y asegura que la respuesta sea SIEMPRE un JSON, evitando el error de "Unexpected token <"
app.use((err, req, res, next) => {
    console.error('❌ SERVER ERROR:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Algo salió mal en el servidor de Puma Code',
        details: err.message 
    });
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('-------------------------------------------');
    console.log(`🚀 Puma Code Server ready on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api/ai`);
    console.log('-------------------------------------------');
});