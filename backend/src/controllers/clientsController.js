// --- Clientes (cada cliente = una venta) ---
const { pool } = require('../config/db');

// GET /api/clients?status=active&q=texto
exports.list = async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const where = [];
    const params = [];
    if (status) { where.push('c.status = ?'); params.push(status); }
    if (q) {
      where.push('(c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT c.*, u.name AS created_by_name,
              (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS projects_count,
              (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.status <> 'done') AS open_projects
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       ${whereSql}
       ORDER BY c.sale_date DESC, c.id DESC`,
      params
    );
    res.json({ success: true, clients: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/clients/:id
exports.getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    const [projects] = await pool.query(
      'SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, client: rows[0], projects });
  } catch (err) {
    next(err);
  }
};

// POST /api/clients
exports.create = async (req, res, next) => {
  try {
    const {
      name, company, email, phone, service,
      amount, currency, status, sale_date, notes,
    } = req.body || {};

    if (!name) return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });

    const [result] = await pool.query(
      `INSERT INTO clients
        (name, company, email, phone, service, amount, currency, status, sale_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        company || null,
        email || null,
        phone || null,
        service || null,
        Number(amount) || 0,
        currency === 'ARS' ? 'ARS' : 'USD',
        ['lead', 'active', 'finished', 'cancelled'].includes(status) ? status : 'active',
        sale_date || new Date().toISOString().slice(0, 10),
        notes || null,
        req.user.id,
      ]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// PUT /api/clients/:id
exports.update = async (req, res, next) => {
  try {
    const allowed = ['name', 'company', 'email', 'phone', 'service', 'amount', 'currency', 'status', 'sale_date', 'notes'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'amount' ? Number(req.body[key]) || 0 : req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, error: 'Nada para actualizar.' });
    values.push(req.params.id);
    await pool.query(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/clients/:id
exports.remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
