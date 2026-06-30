// Endpoints PÚBLICOS del sello Sentinel (sin autenticación).
// Se embeben en los sitios de los clientes:
//   GET /badge/:token.svg  -> SVG dinámico
//   GET /badge/:token      -> datos JSON
//   GET /v/:token          -> página de verificación HTML
const express = require('express');
const router = express.Router();
const s = require('../controllers/sentinelController');

router.get('/badge/:token.svg', s.badgeSVG);
router.get('/badge/:token', s.badgeJSON);
router.get('/v/:token', s.badgeVerify);

module.exports = router;
