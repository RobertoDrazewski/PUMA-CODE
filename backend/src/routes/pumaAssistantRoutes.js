const express = require('express');
const router = express.Router();
const puma = require('../controllers/pumaAssistantController');
const { requireAuth } = require('../middleware/auth');

router.post('/chat', requireAuth, puma.chat);
router.post('/speak', requireAuth, puma.speak);

module.exports = router;
