// src/validations/jobValidations.js
const { body } = require('express-validator');

const validateJobCreation = [
  body('titulo')
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ min: 5, max: 150 }).withMessage('El título debe tener entre 5 y 150 caracteres'),
  
  body('descripcion')
    .notEmpty().withMessage('La descripción es obligatoria'),
  
  body('requisitos')
    .notEmpty().withMessage('Los requisitos son obligatorios'),
  
  body('empresa_id')
    .notEmpty().withMessage('El ID de la empresa es obligatorio')
    .isNumeric().withMessage('El ID de la empresa debe ser un número')
];

const validateJobUpdate = [
  body('titulo')
    .optional()
    .isLength({ min: 5, max: 150 }).withMessage('El título debe tener entre 5 y 150 caracteres'),
  
  body('descripcion')
    .optional(),
  
  body('requisitos')
    .optional()
];

module.exports = {
  validateJobCreation,
  validateJobUpdate
};