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

  const { generarToken } = require('../core/sentinelBadge');

  // [name, domain, plan, score, last_audit]
  const projects = [
    ['Botas Blancas Studio', 'botasblancasstudio.com', 'profesional', 92, '2026-06-12 10:00:00'],
    ['Agrotech Mendoza', 'agrotech-pumacode.com.ar', 'enterprise', 78, '2026-06-18 15:30:00'],
    ['Good Trip Car Rentals', 'goodtrip.com', 'enterprise', 42, '2026-06-29 09:00:00'],
    ['Puma Code (self-audit)', 'puma-code.com', 'enterprise', 95, '2026-06-10 12:00:00'],
  ];

  for (const [name, domain, plan, score, lastAudit] of projects) {
    const [res] = await pool.query(
      `INSERT INTO sentinel_projects (name, domain, plan, score, badge_token, badge_active, last_audit)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [name, domain, plan, score, generarToken(name, domain), lastAudit]
    );
    const projectId = res.insertId;

    // Una auditoría demo asociada (con un par de hallazgos para "Good Trip").
    const findings =
      name.startsWith('Good Trip')
        ? [
            { titulo: 'Inyección de prompt directa en chatbot', severidad: 'alto', cvss: '7.5', owasp: 'LLM01:2025 - Prompt Injection', descripcion: 'El chatbot revela parte de sus instrucciones ante un ataque de inyección directa.', evidencia: 'Respuesta del chatbot al ataque LLM01-A.', impacto: 'Exposición de lógica interna y posible evasión de controles.', recomendacion: 'Reforzar el system prompt y filtrar entradas de usuario.' },
            { titulo: 'Generación de contenido fuera de alcance', severidad: 'medio', cvss: '5.3', owasp: 'LLM09:2025 - Misinformation', descripcion: 'El chatbot genera contenido fuera de su dominio autorizado.', evidencia: 'Respuesta al ataque LLM05.', impacto: 'Uso indebido del asistente para fines no previstos.', recomendacion: 'Acotar el dominio de respuestas y rechazar pedidos fuera de alcance.' },
          ]
        : [];

    const result = {
      herramienta: name.startsWith('Good Trip') ? 'chatbot' : 'nmap',
      datos_insuficientes: false,
      nota: '',
      infraestructura: [{ parametro: 'Auditoría inicial', valor: 'Datos de demostración' }],
      hallazgos: findings,
      controles_ok: findings.length === 0 ? [{ control: 'Postura general', observacion: 'Sin hallazgos relevantes en la auditoría inicial.' }] : [],
    };

    await pool.query(
      `INSERT INTO sentinel_audits (project_id, plan, tool, score, level, findings_count, status, result_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completada', ?, ?)`,
      [
        projectId, plan, result.herramienta, score,
        score >= 85 ? 'excelente' : score >= 70 ? 'bueno' : score >= 50 ? 'regular' : 'critico',
        findings.length, JSON.stringify(result), lastAudit,
      ]
    );
  }

  console.log('🛡️  Datos demo de Sentinel cargados (proyectos + sellos + auditorías).');
}

async function initDb() {
  await runSchema();
  await seedAdmin();
  await seedSentinel();
}

module.exports = { initDb };
