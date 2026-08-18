// --- Panel de Asistentes IA ---
// El registro de "puestos" vive en la tabla `assistants` (editable desde
// el panel: estado y repo de GitHub). Dos asistentes tienen actividad real:
// - puma-ventas: leads del chat público (ver aiController -> logLead).
// - kalyber-monitor: pega server-to-server al backend de Kalyber
//   (endpoint /internal/status, secreto compartido) y trae el estado
//   real de la flota. Si Kalyber no responde, no rompe el panel — se
//   muestra como "sin conexión" y se seguí viendo el resto normal.
const { pool } = require('../config/db');

const VALID_STATUS = ['planificado', 'desarrollo', 'activo'];

// Trae el estado agregado de la flota de Kalyber. Nunca lanza: si algo
// falla (timeout, secreto mal puesto, Kalyber caído) devuelve null y
// listo, para que el resto del panel siga funcionando.
async function fetchKalyberStatus() {
  const url = process.env.KALYBER_API_URL;
  const secret = process.env.KALYBER_INTERNAL_SECRET;
  if (!url || !secret) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url.replace(/\/$/, '')}/internal/status`, {
      headers: { 'X-Internal-Secret': secret },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data : null;
  } catch (err) {
    console.error('⚠️ No se pudo consultar el estado de Kalyber:', err.message);
    return null;
  }
}

// GET /api/assistants — registro + estadísticas reales de los conectados.
exports.list = async (req, res, next) => {
  try {
    const [assistants] = await pool.query(
      'SELECT `key`, name, role, icon, status, github_repo, updated_at FROM assistants ORDER BY sort_order, id'
    );

    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS ultimos_7d,
         MAX(created_at) AS ultima_actividad,
         SUM(service_type = 'express')    AS express,
         SUM(service_type = 'desarrollo') AS desarrollo,
         SUM(service_type = 'pentest')    AS pentest,
         SUM(status = 'convertido')       AS convertidos
       FROM ai_leads WHERE assistant_key = 'puma-ventas'`
    );
    const s = rows[0];

    // Solo consultamos Kalyber si ese asistente está en el registro —
    // evita una llamada de red innecesaria en cada carga del panel.
    const tieneKalyber = assistants.some((a) => a.key === 'kalyber-monitor');
    const kalyber = tieneKalyber ? await fetchKalyberStatus() : null;

    const withStats = assistants.map((a) => {
      if (a.key === 'puma-ventas') {
        return {
          ...a,
          stats: {
            total: Number(s.total) || 0,
            ultimos_7d: Number(s.ultimos_7d) || 0,
            ultima_actividad: s.ultima_actividad,
            express: Number(s.express) || 0,
            desarrollo: Number(s.desarrollo) || 0,
            pentest: Number(s.pentest) || 0,
            convertidos: Number(s.convertidos) || 0,
          },
          fleet: null,
        };
      }
      if (a.key === 'kalyber-monitor') {
        return { ...a, stats: null, fleet: kalyber };
      }
      return { ...a, stats: null, fleet: null };
    });

    res.json({ success: true, assistants: withStats });
  } catch (err) {
    next(err);
  }
};

// GET /api/assistants/:key/activity — últimos leads capturados.
exports.activity = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (key !== 'puma-ventas') {
      return res.json({ success: true, leads: [] });
    }
    const [leads] = await pool.query(
      `SELECT id, client_name, client_email, project_name, service_type, profile, quoted_usd, language, status, created_at
       FROM ai_leads ORDER BY id DESC LIMIT 50`
    );
    res.json({ success: true, leads });
  } catch (err) {
    next(err);
  }
};

// PUT /api/assistants/leads/:id/status — Roberto marca el seguimiento a mano.
exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const valid = ['cotizado', 'contactado', 'convertido', 'descartado'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido.' });
    }
    await pool.query('UPDATE ai_leads SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// PUT /api/assistants/:key — edita estado y/o repo de GitHub de un asistente.
exports.update = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { status, github_repo } = req.body || {};

    if (status !== undefined && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido.' });
    }
    if (github_repo !== undefined && github_repo !== null && github_repo !== '') {
      const okUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(github_repo.trim());
      if (!okUrl) {
        return res.status(400).json({ success: false, error: 'El link tiene que ser un repo de GitHub válido (https://github.com/usuario/repo).' });
      }
    }

    const [existing] = await pool.query('SELECT id FROM assistants WHERE `key` = ?', [key]);
    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Asistente no encontrado.' });
    }

    const fields = [];
    const values = [];
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (github_repo !== undefined) { fields.push('github_repo = ?'); values.push(github_repo ? github_repo.trim() : null); }

    if (fields.length) {
      values.push(key);
      await pool.query(`UPDATE assistants SET ${fields.join(', ')} WHERE \`key\` = ?`, values);
    }

    const [[updated]] = await pool.query(
      'SELECT `key`, name, role, icon, status, github_repo, updated_at FROM assistants WHERE `key` = ?',
      [key]
    );
    res.json({ success: true, assistant: updated });
  } catch (err) {
    next(err);
  }
};
