const express = require('express');
const router = express.Router();
const s = require('../controllers/sentinelController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Panel
router.get('/', s.overview);
router.get('/planes', s.planes);

// Proyectos
router.post('/projects', s.createProject);
router.put('/projects/:id', s.updateProject);
router.delete('/projects/:id', s.removeProject);
router.get('/projects/:id/audits', s.listAudits);

// Auditorías
router.get('/audits/:id', s.getAudit);
router.get('/audits/:id/report', s.downloadReport);

// Analizador IA
router.post('/analyze', s.analyze);

// Test de chatbots (IA vs IA)
router.get('/chatbot/tests', s.chatbotTests);
router.post('/chatbot/evaluate', s.chatbotEvaluate);

// Comandos guiados
router.get('/commands/:projectId', s.commands);

module.exports = router;