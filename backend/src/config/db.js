// --- Conexión MySQL (Railway) ---
// Usa DATABASE_URL (mysql://user:pass@host:port/db).
// En Railway, podés usar la variable interna MYSQL_URL (más rápida y sin costo de egreso)
// o la pública (proxy). Cualquiera de las dos funciona acá.
const mysql = require('mysql2/promise');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_PUBLIC_URL;

if (!connectionString) {
  console.error('❌ Falta DATABASE_URL / MYSQL_URL en las variables de entorno.');
}

// Pool de conexiones: reutiliza conexiones y aguanta carga concurrente.
const pool = mysql.createPool(
  connectionString || {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'puma',
  }
);

// Helper de prueba de conexión (se llama al iniciar).
async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    console.log('✅ MySQL conectado correctamente.');
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection };
