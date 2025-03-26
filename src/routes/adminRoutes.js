const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminControllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

// Validación para el código de invitación
const validateInviteCode = [
  body('inviteCode')
    .notEmpty().withMessage('El código de invitación es obligatorio')
];

// Generar código de invitación (solo admin)
router.post('/invite-codes', protect, restrictTo('admin'), adminController.generateAdminInviteCode);

// Activar rol de administrador con código
router.post('/activate', protect, validateInviteCode, validateRequest, adminController.activateAdminRole);

module.exports = router;