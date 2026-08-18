const express = require('express');
const router = express.Router();
const assistants = require('../controllers/assistantsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, assistants.list);
router.get('/:key/activity', requireAuth, assistants.activity);
router.put('/leads/:id/status', requireAuth, assistants.updateLeadStatus);
router.put('/:key', requireAuth, assistants.update);

module.exports = router;
