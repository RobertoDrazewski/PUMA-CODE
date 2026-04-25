const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// IMPORTANTE: Los nombres después del punto deben ser EXACTOS a los del controlador
router.post('/chat', aiController.chatWithAI);
router.post('/analyze', aiController.analyzeProject);

module.exports = router;