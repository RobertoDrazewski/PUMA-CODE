const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // npm i express-rate-limit
require('dotenv').config();

const aiRoutes = require(path.join(__dirname, 'src', 'routes', 'aiRoutes'));

const app = express();

// Render/Proxy: necesario para que el rate-limit lea la IP real.
app.set('trust proxy', 1);

// --- CORS ---
// Definí ALLOWED_ORIGINS en tus variables de entorno, separadas por coma.
// Ej: ALLOWED_ORIGINS=https://puma-code.com,https://www.puma-code.com
// Nota: origin '*' + credentials:true es inválido y el navegador lo rechaza.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true, // true = refleja el origin (sin '*' literal)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false, // El frontend no usa cookies; mantenelo en false salvo que las necesites.
  })
);

// --- BODY PARSER ---
// Estandarizamos en JSON. El frontend ya manda 'application/json',
// así que no hace falta el truco de text/plain + JSON.parse manual.
app.use(express.json({ limit: '1mb' }));

// --- RATE LIMIT (protege tu cuota de OpenAI y tu envío de emails) ---
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 requests por IP por ventana
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
// No exponemos err.message al cliente (puede filtrar detalles internos).
// eslint-disable-next-line no-unused-vars
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

// Timeouts (importante para Render + IA, que puede tardar).
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;