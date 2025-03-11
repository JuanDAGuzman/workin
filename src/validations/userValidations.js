const { body, param } = require('express-validator');

// Validación para registro de usuario
const validateUserRegistration = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  
  body('correo')
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Debe ser un correo electrónico válido'),
  
  body('clave')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('sexo')
    .notEmpty().withMessage('El sexo es obligatorio')
];

// Validación para inicio de sesión
const validateUserLogin = [
  body('correo')
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Debe ser un correo electrónico válido'),
  
  body('clave')
    .notEmpty().withMessage('La contraseña es obligatoria')
];

// Validación para restablecimiento de contraseña
const validatePasswordReset = [
  body('nuevaClave')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validación para solicitud de restablecimiento
const validatePasswordResetRequest = [
  body('correo')
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Debe ser un correo electrónico válido')
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordResetRequest
};