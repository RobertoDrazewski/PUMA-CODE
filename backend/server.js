const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./src/config/db');
const { initDb } = require('./src/config/initDb');

// --- Rutas ---
const aiRoutes = require('./src/routes/aiRoutes');
const authRoutes = require('./src/routes/authRoutes');
const usersRoutes = require('./src/routes/usersRoutes');
const clientsRoutes = require('./src/routes/clientsRoutes');
const projectsRoutes = require('./src/routes/projectsRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const sentinelRoutes = require('./src/routes/sentinelRoutes');
const sentinelPublicRoutes = require('./src/routes/sentinelPublicRoutes');

const app = express();

// Railway/Proxy: necesario para que el rate-limit lea la IP real.
app.set('trust proxy', 1);

// --- CORS ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false,
  })
);

// --- BODY PARSER ---
app.use(express.json({ limit: '1mb' }));

// --- RATE LIMIT (solo IA, para controlar costos) ---
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Proba de nuevo en unos minutos.' },
});

// --- RUTAS PUBLICAS / IA ---
app.use('/api/ai', aiLimiter, aiRoutes);

// --- RUTAS DEL PANEL DE CONTROL ---
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sentinel', sentinelRoutes);

// Sellos Sentinel: endpoints PUBLICOS (se embeben en sitios de clientes, sin auth)
app.use('/', sentinelPublicRoutes);

app.get('/', (req, res) => {
  res.status(200).send('Puma Code API is running smoothly...');
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack || err);
  res.status(500).json({ success: false, error: 'Algo salio mal en el servidor de Puma Code' });
});

// --- INICIO ---
const PORT = process.env.PORT || 10000;

async function start() {
  try {
    await testConnection();
    await initDb();
  } catch (err) {
    console.error('No se pudo inicializar la base de datos:', err.message);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log('Puma Code Server ready on port ' + PORT);
    console.log('-------------------------------------------');
  });

  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;
}

start();
