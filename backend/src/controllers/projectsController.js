// --- Proyectos / Tickets (tablero kanban simplificado) ---
const { pool } = require('../config/db');

const STATUSES = ['todo', 'in_progress', 'review', 'done'];

// GET /api/projects   -> todos los tickets con cliente y asignado
exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS client_name, c.company AS client_company,
              u.name AS assignee_name
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       LEFT JOIN users u ON u.id = p.assignee_id
       ORDER BY p.status, p.position, p.id`
    );
    res.json({ success: true, projects: rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
exports.create = async (req, res, next) => {
  try {
    const { client_id, title, description, status, priority, assignee_id, due_date } = req.body || {};
    if (!client_id || !title) {
      return res.status(400).json({ success: false, error: 'Cliente y título son obligatorios.' });
    }
    const st = STATUSES.includes(status) ? status : 'todo';

    const [result] = await pool.query(
      `INSERT INTO projects (client_id, title, description, status, priority, assignee_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        title.trim(),
        description || null,
        st,
        ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        assignee_id || null,
        due_date || null,
      ]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id   (mover de columna, editar, reasignar)
exports.update = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'position', 'client_id'];
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
    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
exports.remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
