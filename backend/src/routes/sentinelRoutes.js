const express = require('express');
const router = express.Router();
const sentinel = require('../controllers/sentinelController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', sentinel.overview);
router.post('/projects', sentinel.createProject);
router.put('/projects/:id', sentinel.updateProject);
router.delete('/projects/:id', sentinel.removeProject);
router.get('/projects/:id/findings', sentinel.listFindings);
router.post('/projects/:id/findings', sentinel.addFinding);
router.put('/findings/:id', sentinel.updateFinding);

module.exports = router;
