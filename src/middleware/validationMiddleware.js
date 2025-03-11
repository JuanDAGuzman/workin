const { validationResult } = require('express-validator');

// Middleware para validar resultados
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Error de validación", 
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  validateRequest
};