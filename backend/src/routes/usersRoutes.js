const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Gestión de trabajadores: solo admin
router.use(requireAuth, requireRole('admin'));

router.get('/', users.list);
router.post('/', users.create);
router.put('/:id', users.update);
router.delete('/:id', users.remove);

module.exports = router;
