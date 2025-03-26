// src/validations/messageValidations.js
const { body } = require('express-validator');

const validateMessage = [
  body('destinatario_id')
    .notEmpty().withMessage('El ID del destinatario es obligatorio')
    .isNumeric().withMessage('El ID del destinatario debe ser un número'),
  
  body('contenido')
    .notEmpty().withMessage('El contenido del mensaje es obligatorio')
    .isLength({ max: 1000 }).withMessage('El mensaje no puede exceder los 1000 caracteres')
];

module.exports = {
  validateMessage
};