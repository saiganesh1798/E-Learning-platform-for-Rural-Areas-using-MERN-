const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { chatWithAssistant } = require('../controllers/assistantController');

// @route   POST api/assistant/chat
// @desc    Chat with the AI course assistant
// @access  Private
router.post('/chat', auth, chatWithAssistant);

module.exports = router;
