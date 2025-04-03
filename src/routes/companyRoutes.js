const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const companyController = require('../controllers/companies/companyController');
const {
  validateCompanyCreation,
  validateCompanyUpdate,
} = require('../validations/companyValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompanyById);

// Validación para verificación
const validateVerification = [
  body('verificada')
    .isBoolean()
    .withMessage('El valor debe ser verdadero o falso'),
];

// Ruta para verificar una empresa (solo admin)
router.put(
  '/:id/verify',
  protect,
  restrictTo('admin'),
  validateVerification,
  validateRequest,
  companyController.verifyCompany
);

// Rutas protegidas
router.post(
  '/',
  protect,
  validateCompanyCreation,
  validateRequest,
  companyController.createCompany
);
router.put(
  '/:id',
  protect,
  validateCompanyUpdate,
  validateRequest,
  companyController.updateCompany
);
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  companyController.deleteCompany
);

module.exports = router;