const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// LINEA 6: Asegúrate de que chatWithAI esté bien escrito
router.post('/chat', aiController.chatWithAI);

// Asegúrate de que analyzeProject esté bien escrito
router.post('/analyze', aiController.analyzeProject);

module.exports = router;