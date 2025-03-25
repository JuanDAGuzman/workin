// src/validations/companyValidations.js
const { body } = require('express-validator');

const validateCompanyCreation = [
  body('nombre')
    .notEmpty().withMessage('El nombre de la empresa es obligatorio')
    .isLength({ min: 3, max: 150 }).withMessage('El nombre debe tener entre 3 y 150 caracteres')
];

const validateCompanyUpdate = [
  body('nombre')
    .optional()
    .isLength({ min: 3, max: 150 }).withMessage('El nombre debe tener entre 3 y 150 caracteres')
];

module.exports = {
  validateCompanyCreation,
  validateCompanyUpdate
};