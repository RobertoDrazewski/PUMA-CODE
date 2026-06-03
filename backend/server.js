const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs'); // Importamos para diagnosticar
require('dotenv').config();

// --- DIAGNÓSTICO ---
const rutaAi = path.join(__dirname, 'src', 'routes', 'aiRoutes.js');
console.log('--- DIAGNÓSTICO DE RUTA ---');
console.log('Directorio actual (__dirname):', __dirname);
console.log('¿Existe el archivo aiRoutes.js en:', rutaAi, '?', fs.existsSync(rutaAi));
console.log('---------------------------');

// Si esto falla, el archivo no existe donde crees que existe
const aiRoutes = require(rutaAi);

const app = express();
// ... resto de tu código

// Render/Proxy: necesario para que el rate-limit lea la IP real.
app.set('trust proxy', 1);

// --- CORS ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false,
  })
);

// --- BODY PARSER ---
app.use(express.json({ limit: '1mb' }));

// --- RATE LIMIT ---
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Probá de nuevo en unos minutos.' },
});

// --- RUTAS ---
app.use('/api/ai', aiLimiter, aiRoutes);

app.get('/', (req, res) => {
  res.status(200).send('🐆 Puma Code API is running smoothly...');
});

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err.stack || err);
  res.status(500).json({ success: false, error: 'Algo salió mal en el servidor de Puma Code' });
});

// --- INICIO ---
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log(`🚀 Puma Code Server ready on port ${PORT}`);
  console.log('-------------------------------------------');
});

// Timeouts para peticiones largas (IA)
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;