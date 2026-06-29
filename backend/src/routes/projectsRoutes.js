const express = require('express');
const router = express.Router();
const projects = require('../controllers/projectsController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', projects.list);
router.post('/', projects.create);
router.put('/:id', projects.update);
router.delete('/:id', projects.remove);

module.exports = router;
