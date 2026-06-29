const express = require('express');
const router = express.Router();
const clients = require('../controllers/clientsController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', clients.list);
router.get('/:id', clients.getOne);
router.post('/', clients.create);
router.put('/:id', clients.update);
router.delete('/:id', clients.remove);

module.exports = router;
