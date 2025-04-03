const jwt = require('jsonwebtoken');
const {
  AuthenticationError,
  ForbiddenError,
} = require('../utils/errorClasses');
//const authService = require("../services/authService");
const pool = require('../config/db');

// Middleware para verificar si el usuario está autenticado
const protect = async (req, res, next) => {
  try {
    // 1) Obtener token del header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar que el token existe
    if (!token) {
      return next(
        new AuthenticationError(
          'No ha iniciado sesión. Por favor, inicie sesión para obtener acceso.'
        )
      );
    }

    // 2) Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Verificar si el usuario aún existe
    const userResult = await pool.query(
      'SELECT id, nombre, correo, verificado, rol, empresa_id FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return next(
        new AuthenticationError('El usuario de este token ya no existe.')
      );
    }

    // 4) Agregar el usuario a la solicitud
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(
        new AuthenticationError(
          'Token inválido. Por favor inicie sesión nuevamente.'
        )
      );
    }
    if (error.name === 'TokenExpiredError') {
      return next(
        new AuthenticationError(
          'Su token ha expirado. Por favor inicie sesión nuevamente.'
        )
      );
    }
    next(error);
  }
};

// Middleware para restringir acceso según roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // El middleware protect debe usarse antes
    if (!req.user || !req.user.rol) {
      return next(
        new ForbiddenError('Usuario no encontrado o sin rol asignado')
      );
    }

    if (!roles.includes(req.user.rol)) {
      return next(
        new ForbiddenError('No tiene permiso para realizar esta acción')
      );
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
