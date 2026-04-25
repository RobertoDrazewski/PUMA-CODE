const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rutas
const aiRoutes = require('./routes/aiRoutes'); 

const app = express();

// --- MIDDLEWARES ---

// Configuración de CORS mejorada para producción
app.use(cors({
    origin: '*', // En producción puedes cambiar '*' por tu URL de frontend de Render
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Vital para procesar los cuerpos de las peticiones

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
// Render usa el puerto de la variable de entorno PORT, por eso process.env.PORT es vital
const PORT = process.env.PORT || 10000; 

app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log(`🚀 Puma Code Server ready on port ${PORT}`);
    console.log('-------------------------------------------');
});