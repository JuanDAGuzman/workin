const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messages/messageController');
const { validateMessage } = require('../validations/messageValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Obtener todas las conversaciones del usuario actual
router.get('/conversations', protect, messageController.getUserConversations);

// Obtener conversación con un usuario específico
router.get('/conversation/:userId', protect, messageController.getConversation);

// Enviar un mensaje
router.post('/', protect, validateMessage, validateRequest, messageController.sendMessage);

module.exports = router;