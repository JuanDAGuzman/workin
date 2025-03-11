const { AppError } = require('../utils/errorClasses');

// Middleware para manejar errores desconocidos
const handleJWTError = () => 
  new AppError('Token inválido. Por favor inicie sesión nuevamente.', 401);

const handleJWTExpiredError = () => 
  new AppError('Su token ha expirado. Por favor inicie sesión nuevamente.', 401);

// Respuestas de error para desarrollo
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Respuestas de error para producción
const sendErrorProd = (err, res) => {
  // Errores operacionales, confiables: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Errores de programación o desconocidos: no filtrar detalles
  else {
    // Registrar el error
    console.error('ERROR 💥', err);
    
    // Enviar mensaje genérico
    res.status(500).json({
      status: 'error',
      message: 'Algo salió mal'
    });
  }
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, res);
  }
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`No se puede encontrar ${req.originalUrl} en este servidor`, 404);
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler
};