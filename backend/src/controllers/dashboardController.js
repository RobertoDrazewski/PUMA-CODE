// --- Métricas del panel de control ---
const { pool } = require('../config/db');

// GET /api/dashboard
exports.summary = async (req, res, next) => {
  try {
    // Ventas del mes actual (por moneda)
    const [salesMonth] = await pool.query(
      `SELECT currency, COUNT(*) AS ventas, COALESCE(SUM(amount),0) AS total
       FROM clients
       WHERE status <> 'cancelled'
         AND YEAR(sale_date) = YEAR(CURDATE())
         AND MONTH(sale_date) = MONTH(CURDATE())
       GROUP BY currency`
    );

    // Totales históricos por moneda
    const [salesTotal] = await pool.query(
      `SELECT currency, COUNT(*) AS ventas, COALESCE(SUM(amount),0) AS total
       FROM clients WHERE status <> 'cancelled'
       GROUP BY currency`
    );

    // Conteo de clientes por estado
    const [byStatus] = await pool.query(
      `SELECT status, COUNT(*) AS n FROM clients GROUP BY status`
    );

    // Clientes con trabajo activo (tienen al menos 1 ticket no terminado)
    const [activeWork] = await pool.query(
      `SELECT COUNT(DISTINCT client_id) AS n FROM projects WHERE status <> 'done'`
    );

    // Tickets por columna
    const [tickets] = await pool.query(
      `SELECT status, COUNT(*) AS n FROM projects GROUP BY status`
    );

    // Ventas de los últimos 6 meses (para el gráfico) — moneda USD y ARS por separado
    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(sale_date, '%Y-%m') AS ym, currency,
              COALESCE(SUM(amount),0) AS total, COUNT(*) AS ventas
       FROM clients
       WHERE status <> 'cancelled'
         AND sale_date >= DATE_SUB(DATE_FORMAT(CURDATE(),'%Y-%m-01'), INTERVAL 5 MONTH)
       GROUP BY ym, currency
       ORDER BY ym`
    );

    // Últimos clientes
    const [recentClients] = await pool.query(
      `SELECT id, name, company, service, amount, currency, status, sale_date
       FROM clients ORDER BY id DESC LIMIT 6`
    );

    res.json({
      success: true,
      salesMonth,
      salesTotal,
      byStatus,
      activeWork: activeWork[0].n,
      tickets,
      monthly,
      recentClients,
    });
  } catch (err) {
    next(err);
  }
};
