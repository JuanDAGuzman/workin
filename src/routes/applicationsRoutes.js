const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applications/applicationController');
const {
  validateApplicationCreation,
  validateStatusUpdate,
} = require('../validations/applicationValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Obtener postulaciones del usuario actual
router.get('/me', protect, applicationController.getUserApplications);

// Obtener postulaciones para un empleo específico (solo empresas)
router.get(
  '/job/:empleo_id',
  protect,
  restrictTo('admin', 'empresa'),
  applicationController.getJobApplications
);

// Crear una nueva postulación
router.post(
  '/',
  protect,
  validateApplicationCreation,
  validateRequest,
  applicationController.createApplication
);

// Actualizar estado de una postulación (solo empresas)
router.put(
  '/:id/status',
  protect,
  restrictTo('admin', 'empresa'),
  validateStatusUpdate,
  validateRequest,
  applicationController.updateApplicationStatus
);

// Eliminar una postulación
router.delete('/:id', protect, applicationController.deleteApplication);

module.exports = router;
