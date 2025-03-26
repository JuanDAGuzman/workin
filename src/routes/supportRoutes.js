const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support/supportController');
const { validateSupportRequest, validateSupportResponse } = require('../validations/supportValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Obtener todas las solicitudes (solo admin)
router.get('/', protect, restrictTo('admin'), supportController.getAllSupportRequests);

// Obtener solicitudes del usuario actual
router.get('/me', protect, supportController.getUserSupportRequests);

// Crear una solicitud de soporte
router.post('/', protect, validateSupportRequest, validateRequest, supportController.createSupportRequest);

// Responder a una solicitud (solo admin)
router.post('/:id/respond', protect, restrictTo('admin'), validateSupportResponse, validateRequest, supportController.respondToSupportRequest);

module.exports = router;