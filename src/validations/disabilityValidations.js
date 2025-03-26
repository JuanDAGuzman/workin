// src/validations/disabilityValidations.js
const { body } = require("express-validator");

const validateDisabilityCreation = [
  body("nombre")
    .notEmpty()
    .withMessage("El nombre de la discapacidad es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres"),
];

const validateUserDisabilityRegister = [
  body("discapacidad_id")
    .notEmpty()
    .withMessage("El ID de la discapacidad es obligatorio")
    .isNumeric()
    .withMessage("El ID de la discapacidad debe ser un número"),

  body("descripcion")
    .optional()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder los 500 caracteres"),

  body("certificado_url")
    .optional()
    .isURL()
    .withMessage("La URL del certificado debe ser una URL válida"),
];

const validateUserDisabilityUpdate = [
  body("descripcion")
    .optional()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder los 500 caracteres"),

  body("certificado_url")
    .optional()
    .isURL()
    .withMessage("La URL del certificado debe ser una URL válida"),
];

const validateDisabilityVerification = [
  body("verificado")
    .notEmpty()
    .withMessage("El estado de verificación es obligatorio")
    .isBoolean()
    .withMessage("El estado de verificación debe ser un valor booleano"),
];

module.exports = {
  validateDisabilityCreation,
  validateUserDisabilityRegister,
  validateUserDisabilityUpdate,
  validateDisabilityVerification,
};
