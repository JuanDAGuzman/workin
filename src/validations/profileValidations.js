// src/validations/profileValidations.js
const { body } = require('express-validator');

const validateProfileUpdate = [
  body('nombre')
    .optional()
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  
  body('sexo')
    .optional()
];

const validateEmailChange = [
  body('nuevoCorreo')
    .notEmpty().withMessage('El nuevo correo es obligatorio')
    .isEmail().withMessage('Debe ser un correo electrónico válido'),
  
  body('clave')
    .notEmpty().withMessage('La contraseña actual es obligatoria')
];

const validatePasswordChange = [
  body('claveActual')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),
  
  body('nuevaClave')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .custom((value, { req }) => {
      if (value === req.body.claveActual) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    })
];

module.exports = {
  validateProfileUpdate,
  validateEmailChange,
  validatePasswordChange
};