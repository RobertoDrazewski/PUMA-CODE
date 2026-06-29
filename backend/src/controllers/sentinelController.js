// --- Sentinel · módulo de cybersecurity ---
const { pool } = require('../config/db');

// GET /api/sentinel  -> panel completo (proyectos, métricas, hallazgos, actividad)
exports.overview = async (req, res, next) => {
  try {
    const [projects] = await pool.query(
      `SELECT sp.*,
              (SELECT COUNT(*) FROM sentinel_findings f
                WHERE f.sentinel_project_id = sp.id AND f.status='open') AS open_findings
       FROM sentinel_projects sp
       ORDER BY sp.score ASC`
    );

    const [[metrics]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM sentinel_projects WHERE monitored=1) AS monitored,
         (SELECT ROUND(AVG(score)) FROM sentinel_projects) AS avg_score,
         (SELECT COUNT(*) FROM sentinel_findings WHERE status='open') AS open_findings,
         (SELECT COUNT(*) FROM sentinel_findings WHERE status='open' AND severity IN ('high','critical')) AS high_findings,
         (SELECT MAX(last_audit) FROM sentinel_projects) AS last_audit`
    );

    const [activity] = await pool.query(
      `SELECT * FROM sentinel_activity ORDER BY created_at DESC LIMIT 8`
    );

    res.json({ success: true, projects, metrics, activity });
  } catch (err) {
    next(err);
  }
};

// POST /api/sentinel/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, domain, plan, score, status, last_audit } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });

    const [result] = await pool.query(
      `INSERT INTO sentinel_projects (name, domain, plan, score, status, monitored, last_audit)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        name.trim(),
        domain || null,
        ['Basico', 'Profesional', 'Enterprise'].includes(plan) ? plan : 'Profesional',
        Math.max(0, Math.min(100, Number(score) || 0)),
        ['SEGURO', 'ACEPTABLE', 'MEJORABLE', 'CRITICO'].includes(status) ? status : 'ACEPTABLE',
        last_audit || new Date().toISOString().slice(0, 10),
      ]
    );
    await pool.query('INSERT INTO sentinel_activity (message) VALUES (?)', [
      `Nuevo proyecto agregado a Sentinel: ${name.trim()}.`,
    ]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// PUT /api/sentinel/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const allowed = ['name', 'domain', 'plan', 'score', 'status', 'monitored', 'last_audit'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, error: 'Nada para actualizar.' });
    values.push(req.params.id);
    await pool.query(`UPDATE sentinel_projects SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sentinel/projects/:id
exports.removeProject = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sentinel_projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/sentinel/projects/:id/findings
exports.addFinding = async (req, res, next) => {
  try {
    const { title, severity } = req.body || {};
    if (!title) return res.status(400).json({ success: false, error: 'El título es obligatorio.' });
    await pool.query(
      `INSERT INTO sentinel_findings (sentinel_project_id, title, severity) VALUES (?, ?, ?)`,
      [req.params.id, title.trim(), ['low', 'medium', 'high', 'critical'].includes(severity) ? severity : 'medium']
    );
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// PUT /api/sentinel/findings/:id   (resolver hallazgo)
exports.updateFinding = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    await pool.query('UPDATE sentinel_findings SET status = ? WHERE id = ?', [
      status === 'resolved' ? 'resolved' : 'open',
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/sentinel/projects/:id/findings
exports.listFindings = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sentinel_findings WHERE sentinel_project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, findings: rows });
  } catch (err) {
    next(err);
  }
};
