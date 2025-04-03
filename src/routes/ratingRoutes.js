const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratings/ratingController');
const { validateRatingCreation } = require('../validations/ratingValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Obtener valoraciones de una empresa (público)
router.get('/company/:empresa_id', ratingController.getCompanyRatings);

// Obtener valoraciones del usuario actual
router.get('/me', protect, ratingController.getUserRatings);

// Crear o actualizar una valoración
router.post(
  '/',
  protect,
  validateRatingCreation,
  validateRequest,
  ratingController.createOrUpdateRating
);

// Eliminar una valoración
router.delete('/:id', protect, ratingController.deleteRating);

module.exports = router;
