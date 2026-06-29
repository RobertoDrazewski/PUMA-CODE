// --- Gestión de usuarios / trabajadores (solo admin) ---
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// GET /api/users
exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/users   { name, email, password, role }
exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son obligatorios.' });
    }
    const cleanRole = role === 'admin' ? 'admin' : 'worker';
    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), String(email).trim().toLowerCase(), hash, cleanRole]
    );
    res.status(201).json({
      success: true,
      user: { id: result.insertId, name, email, role: cleanRole, active: 1 },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Ya existe un usuario con ese email.' });
    }
    next(err);
  }
};

// PUT /api/users/:id   { name?, role?, active?, password? }
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, active, password } = req.body || {};
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role === 'admin' ? 'admin' : 'worker'); }
    if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
    if (password) { fields.push('password_hash = ?'); values.push(await bcrypt.hash(password, 10)); }

    if (!fields.length) {
      return res.status(400).json({ success: false, error: 'Nada para actualizar.' });
    }
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id   (desactiva, no borra, para conservar historial)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ success: false, error: 'No podés desactivarte a vos mismo.' });
    }
    await pool.query('UPDATE users SET active = 0 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
