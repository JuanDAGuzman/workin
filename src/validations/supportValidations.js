// src/validations/supportValidations.js
const { body } = require('express-validator');

const validateSupportRequest = [
  body('motivo')
    .notEmpty().withMessage('El motivo de la solicitud es obligatorio')
    .isLength({ min: 10, max: 500 }).withMessage('El motivo debe tener entre 10 y 500 caracteres')
];

const validateSupportResponse = [
  body('respuesta')
    .notEmpty().withMessage('La respuesta es obligatoria')
    .isLength({ min: 10, max: 1000 }).withMessage('La respuesta debe tener entre 10 y 1000 caracteres')
];

module.exports = {
  validateSupportRequest,
  validateSupportResponse
};