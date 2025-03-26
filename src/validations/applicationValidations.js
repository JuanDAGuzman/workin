// src/validations/applicationValidations.js
const { body } = require("express-validator");

const validateApplicationCreation = [
  body("empleo_id")
    .notEmpty()
    .withMessage("El ID del empleo es obligatorio")
    .isNumeric()
    .withMessage("El ID del empleo debe ser un número"),
];

const validateStatusUpdate = [
  body("estado")
    .notEmpty()
    .withMessage("El estado es obligatorio")
    .isIn(["pendiente", "revisando", "entrevista", "rechazado", "aceptado"])
    .withMessage("Estado inválido"),
];

module.exports = {
  validateApplicationCreation,
  validateStatusUpdate,
};
