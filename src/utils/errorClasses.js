// Error base para la aplicación
class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true; // Errores que esperamos que ocurran
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Error para cuando un recurso no se encuentra
  class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
      super(message, 404);
    }
  }
  
  // Error para errores de autenticación
  class AuthenticationError extends AppError {
    constructor(message = 'No autorizado') {
      super(message, 401);
    }
  }
  
  // Error para errores de autorización
  class ForbiddenError extends AppError {
    constructor(message = 'Prohibido') {
      super(message, 403);
    }
  }
  
  // Error para datos inválidos
  class ValidationError extends AppError {
    constructor(message = 'Datos inválidos') {
      super(message, 400);
    }
  }
  
  // Error para conflictos (ej: duplicados)
  class ConflictError extends AppError {
    constructor(message = 'Conflicto con los recursos existentes') {
      super(message, 409);
    }
  }
  
  module.exports = {
    AppError,
    NotFoundError,
    AuthenticationError,
    ForbiddenError,
    ValidationError,
    ConflictError
  };