const jwt = require('jsonwebtoken');
const authService = require('../../services/authService');
const emailService = require('../../services/emailService');
const pool = require('../../config/db');
const { NotFoundError, AuthenticationError } = require('../../utils/errorClasses');

const requestPasswordReset = async (req, res, next) => {
  const { correo } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT id, nombre FROM users WHERE correo = $1",
      [correo]
    );

    if (userResult.rows.length === 0) {
      return next(new NotFoundError("Usuario no encontrado"));
    }

    const user = userResult.rows[0];

    // Generar token de restablecimiento
    const resetToken = authService.generateToken({ correo });

    // Almacenar el token en la base de datos
    await authService.storeResetToken(correo, resetToken);

    // Enviar correo con enlace de restablecimiento
    try {
      await emailService.sendPasswordResetEmail(correo, user.nombre, resetToken);
      res.json({
        message: "Se ha enviado un enlace de restablecimiento a tu correo",
      });
    } catch (emailError) {
      console.error("Error al enviar correo de restablecimiento:", emailError);
      res.json({
        message: "Solicitud procesada, pero hubo un problema al enviar el correo",
        resetToken
      });
    }
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { nuevaClave } = req.body;

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { correo } = decoded;

    // Actualizar contraseña
    try {
      await authService.updateUserPassword(correo, token, nuevaClave);
      res.json({ message: "Contraseña restablecida con éxito" });
    } catch (updateError) {
      next(new AuthenticationError("Token inválido o ya usado"));
    }
  } catch (error) {
    next(new AuthenticationError("Token inválido o expirado"));
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword
};