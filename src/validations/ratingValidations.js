// src/validations/ratingValidations.js
const { body } = require("express-validator");

const validateRatingCreation = [
  body("empresa_id")
    .notEmpty()
    .withMessage("El ID de la empresa es obligatorio")
    .isNumeric()
    .withMessage("El ID de la empresa debe ser un número"),

  body("calificacion")
    .notEmpty()
    .withMessage("La calificación es obligatoria")
    .isInt({ min: 1, max: 5 })
    .withMessage("La calificación debe ser un número entre 1 y 5"),

  body("comentario")
    .optional()
    .isLength({ max: 500 })
    .withMessage("El comentario no puede exceder los 500 caracteres"),
];

module.exports = {
  validateRatingCreation,
};
