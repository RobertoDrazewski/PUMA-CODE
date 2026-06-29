// --- Inicializa la base de datos al arrancar ---
// 1) Ejecuta el schema.sql (CREATE TABLE IF NOT EXISTS -> es idempotente).
// 2) Crea un usuario admin inicial si la tabla users está vacía.
// 3) Carga datos demo de Sentinel la primera vez (para que el panel no esté vacío).
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function runSchema() {
  const raw = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Sacamos los comentarios de línea (-- ...) para no romper el split por ';'.
  const sql = raw
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log('✅ Esquema verificado/creado.');
}

async function seedAdmin() {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users');
  if (rows[0].n > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@puma-code.com';
  const password = process.env.ADMIN_PASSWORD || 'PumaAdmin2026!';
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Roberto D.', email, hash, 'admin']
  );
  console.log('👤 Admin inicial creado:');
  console.log(`   email: ${email}`);
  console.log(`   pass : ${password}  (cambialo en el panel)`);
}

async function seedSentinel() {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM sentinel_projects');
  if (rows[0].n > 0) return;

  const projects = [
    ['Botas Blancas Studio', 'botasblancasstudio.com', 'Profesional', 92, 'SEGURO', '2026-06-12'],
    ['Agrotech Mendoza', 'agrotech-pumacode.com.ar', 'Enterprise', 78, 'ACEPTABLE', '2026-06-18'],
    ['Good Trip Car Rentals', 'goodtrip.com', 'Enterprise', 42, 'MEJORABLE', '2026-06-29'],
    ['Puma Code (self-audit)', 'puma-code.com', 'Enterprise', 95, 'SEGURO', '2026-06-10'],
  ];
  for (const p of projects) {
    await pool.query(
      'INSERT INTO sentinel_projects (name, domain, plan, score, status, monitored, last_audit) VALUES (?, ?, ?, ?, ?, 1, ?)',
      p
    );
  }

  // Hallazgos demo para "Good Trip" (id 3)
  const findings = [
    [3, 'Inyección de prompt directa', 'high', 'open'],
    [3, 'Generación de contenido fuera de alcance', 'medium', 'open'],
    [3, 'Jailbreak por rol parcial', 'high', 'open'],
    [2, 'Fuga de instrucciones del sistema', 'medium', 'open'],
  ];
  for (const f of findings) {
    await pool.query(
      'INSERT INTO sentinel_findings (sentinel_project_id, title, severity, status) VALUES (?, ?, ?, ?)',
      f
    );
  }

  const activity = [
    'Good Trip — re-pentest detectó 7 hallazgos, score bajó a 42.',
    'Agrotech — test de chatbot con IA encontró 1 vulnerabilidad de alcance.',
    'Botas Blancas — monitoreo diario OK. Score estable en 92.',
  ];
  for (const m of activity) {
    await pool.query('INSERT INTO sentinel_activity (message) VALUES (?)', [m]);
  }
  console.log('🛡️  Datos demo de Sentinel cargados.');
}

async function initDb() {
  await runSchema();
  await seedAdmin();
  await seedSentinel();
}

module.exports = { initDb };
