// src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companies/companyController');
const { validateCompanyCreation, validateCompanyUpdate } = require('../validations/companyValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompanyById);

// Rutas protegidas
router.post('/', protect, validateCompanyCreation, validateRequest, companyController.createCompany);
router.put('/:id', protect, validateCompanyUpdate, validateRequest, companyController.updateCompany);
router.delete('/:id', protect, restrictTo('admin'), companyController.deleteCompany);

module.exports = router;