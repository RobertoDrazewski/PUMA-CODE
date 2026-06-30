// ============================================================
//  Sentinel · Controlador (cybersecurity)
//  Porta la lógica del Sentinel de Mauro a Node/Express + MySQL,
//  usando el login y la API key de IA (OpenAI) del proyecto.
// ============================================================
const { pool } = require('../config/db');
const { analizarSalida, calcularScore, obtenerTests, evaluarRespuestaChatbot } = require('../core/sentinelAI');
const { generarToken, calcularEstadoSello, generarBadgeSVG, generarPaginaVerificacion } = require('../core/sentinelBadge');
const { PLANES, normalizarPlan, comandosPara } = require('../core/sentinelCommands');

const DIA_MS = 24 * 60 * 60 * 1000;
const fmtFecha = (d) => (d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Nunca');

function estadoDeProyecto(p) {
  const dias = p.last_audit ? Math.floor((Date.now() - new Date(p.last_audit).getTime()) / DIA_MS) : 0;
  return calcularEstadoSello(Number(p.score), !!p.badge_active, dias);
}

// GET /api/sentinel  → panel (stats + proyectos)
exports.overview = async (req, res, next) => {
  try {
    const [projects] = await pool.query('SELECT * FROM sentinel_projects ORDER BY score ASC');
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM sentinel_projects) AS proyectos,
        (SELECT ROUND(AVG(score),1) FROM sentinel_projects) AS score_promedio,
        (SELECT COUNT(*) FROM sentinel_audits) AS auditorias,
        (SELECT MAX(last_audit) FROM sentinel_projects) AS ultima_auditoria
    `);

    const lista = projects.map((p) => {
      const est = estadoDeProyecto(p);
      return {
        id: p.id, nombre: p.name, dominio: p.domain, plan: p.plan,
        score: Number(p.score), fecha: fmtFecha(p.last_audit),
        estado: est.estado, label: est.label, color: est.color,
        token: p.badge_token, badge_active: !!p.badge_active,
      };
    });

    res.json({
      success: true,
      stats: {
        proyectos: stats.proyectos || 0,
        score_promedio: stats.score_promedio || 0,
        auditorias: stats.auditorias || 0,
        ultima_auditoria: stats.ultima_auditoria ? fmtFecha(stats.ultima_auditoria) : 'Ninguna',
      },
      proyectos: lista,
    });
  } catch (err) { next(err); }
};

// GET /api/sentinel/planes
exports.planes = async (req, res) => res.json({ success: true, planes: PLANES });

// POST /api/sentinel/projects  { name, domain, contact, plan }
exports.createProject = async (req, res, next) => {
  try {
    const { name, domain, contact, plan } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });
    const pk = normalizarPlan(plan);
    const planFinal = PLANES[pk] ? pk : 'profesional';
    const token = generarToken(name, domain || name);
    const [r] = await pool.query(
      `INSERT INTO sentinel_projects (name, domain, contact, plan, badge_token) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), domain || null, contact || null, planFinal, token]
    );
    res.status(201).json({ success: true, id: r.insertId, token });
  } catch (err) { next(err); }
};

// PUT /api/sentinel/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const allowed = ['name', 'domain', 'contact', 'plan', 'badge_active'];
    const fields = [], values = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        let v = req.body[k];
        if (k === 'plan') v = PLANES[normalizarPlan(v)] ? normalizarPlan(v) : 'profesional';
        if (k === 'badge_active') v = v ? 1 : 0;
        fields.push(`${k} = ?`); values.push(v);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, error: 'Nada para actualizar.' });
    values.push(req.params.id);
    await pool.query(`UPDATE sentinel_projects SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// DELETE /api/sentinel/projects/:id
exports.removeProject = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sentinel_projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// GET /api/sentinel/projects/:id/audits
exports.listAudits = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, plan, tool, score, level, findings_count, status, created_at
       FROM sentinel_audits WHERE project_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, audits: rows });
  } catch (err) { next(err); }
};

// GET /api/sentinel/audits/:id  → detalle completo (result_json parseado)
exports.getAudit = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sentinel_audits WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Auditoría no encontrada.' });
    const a = rows[0];
    let detalle = {};
    try { detalle = JSON.parse(a.result_json || '{}'); } catch { detalle = {}; }
    res.json({ success: true, audit: { ...a, detalle } });
  } catch (err) { next(err); }
};

// POST /api/sentinel/analyze  { project_id, tool, raw_output }
// Valida herramienta vs plan, corre el analizador IA, calcula score,
// guarda la auditoría y actualiza el sello del proyecto.
exports.analyze = async (req, res, next) => {
  try {
    const { project_id, tool, raw_output } = req.body || {};
    if (!project_id || !tool) return res.status(400).json({ success: false, error: 'Proyecto y herramienta son obligatorios.' });

    const [rows] = await pool.query('SELECT * FROM sentinel_projects WHERE id = ?', [project_id]);
    const proyecto = rows[0];
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado.' });

    const planConfig = PLANES[proyecto.plan] || PLANES.profesional;
    const herramienta = String(tool).toLowerCase().trim();
    if (!planConfig.herramientas.includes(herramienta)) {
      return res.status(403).json({
        success: false,
        error: `La herramienta "${herramienta}" no está incluida en el Plan ${planConfig.nombre}. Permitidas: ${planConfig.herramientas.join(', ')}.`,
      });
    }

    const contexto = { nombre: proyecto.name, dominio: proyecto.domain, pais: proyecto.country, plan: planConfig.nombre };
    const resultado = await analizarSalida(herramienta, raw_output, contexto);
    if (resultado.error) return res.status(500).json({ success: false, error: resultado.error });

    const hallazgos = resultado.hallazgos || [];
    const scoreData = calcularScore(hallazgos);

    const [ins] = await pool.query(
      `INSERT INTO sentinel_audits (project_id, plan, tool, score, level, findings_count, status, result_json)
       VALUES (?, ?, ?, ?, ?, ?, 'completada', ?)`,
      [proyecto.id, planConfig.nombre, herramienta, scoreData.score, scoreData.nivel, hallazgos.length, JSON.stringify(resultado)]
    );

    // El sello/score del proyecto se actualiza con la última auditoría.
    await pool.query(
      'UPDATE sentinel_projects SET score = ?, last_audit = NOW() WHERE id = ?',
      [scoreData.score, proyecto.id]
    );

    res.json({
      success: true,
      audit_id: ins.insertId,
      cliente: proyecto.name,
      plan: planConfig.nombre,
      herramienta,
      hallazgos: hallazgos.length,
      score: scoreData,
      detalle: resultado,
    });
  } catch (err) { next(err); }
};

// GET /api/sentinel/chatbot/tests  → lista de ataques (sin el criterio interno)
exports.chatbotTests = async (req, res) => res.json({ success: true, tests: obtenerTests() });

// POST /api/sentinel/chatbot/evaluate  { test_id, chatbot_response }
exports.chatbotEvaluate = async (req, res, next) => {
  try {
    const { test_id, chatbot_response } = req.body || {};
    if (!test_id || !chatbot_response) return res.status(400).json({ success: false, error: 'test_id y la respuesta del chatbot son obligatorios.' });
    const resultado = await evaluarRespuestaChatbot(test_id, chatbot_response);
    if (resultado.error) return res.status(500).json({ success: false, error: resultado.error });
    res.json({ success: true, resultado });
  } catch (err) { next(err); }
};

// GET /api/sentinel/commands/:projectId  → comandos guiados según plan
exports.commands = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sentinel_projects WHERE id = ?', [req.params.projectId]);
    const p = rows[0];
    if (!p) return res.status(404).json({ success: false, error: 'Proyecto no encontrado.' });
    const comandos = comandosPara(p.plan, p.domain);
    res.json({ success: true, cliente: p.name, dominio: p.domain, plan: p.plan, total_pasos: comandos.length, comandos });
  } catch (err) { next(err); }
};

// ============================================================
//  Endpoints PÚBLICOS del sello (sin auth — se embeben en sitios)
// ============================================================
async function cargarSello(token) {
  const [rows] = await pool.query('SELECT * FROM sentinel_projects WHERE badge_token = ?', [token]);
  return rows[0] || null;
}

// GET /badge/:token.svg
exports.badgeSVG = async (req, res, next) => {
  try {
    const token = String(req.params.token).replace(/\.svg$/, '');
    const p = await cargarSello(token);
    if (!p) return res.status(404).type('image/svg+xml').send(generarBadgeSVG(0, { color: '#888780', label: 'No encontrado' }));
    const est = estadoDeProyecto(p);
    res.set('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.type('image/svg+xml').send(generarBadgeSVG(Number(p.score), est));
  } catch (err) { next(err); }
};

// GET /badge/:token  (JSON)
exports.badgeJSON = async (req, res, next) => {
  try {
    const p = await cargarSello(req.params.token);
    if (!p) return res.status(404).json({ error: 'Sello no encontrado' });
    const est = estadoDeProyecto(p);
    res.json({
      token: p.badge_token, score: Number(p.score), estado: est.estado, label: est.label,
      color: est.color, activo: !!p.badge_active, cliente: p.name, dominio: p.domain,
      plan: p.plan, fecha_auditoria: fmtFecha(p.last_audit),
    });
  } catch (err) { next(err); }
};

// GET /v/:token  (página HTML de verificación)
exports.badgeVerify = async (req, res, next) => {
  try {
    const p = await cargarSello(req.params.token);
    if (!p) return res.status(404).send('<h1>Sello no encontrado</h1>');
    const est = estadoDeProyecto(p);
    res.type('html').send(generarPaginaVerificacion({
      nombre: p.name, dominio: p.domain, plan: p.plan, fecha: fmtFecha(p.last_audit), estado: est, score: Number(p.score),
    }));
  } catch (err) { next(err); }
};
