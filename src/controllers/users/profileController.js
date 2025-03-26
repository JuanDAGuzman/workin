const pool = require("../../config/db");
const jwt = require("jsonwebtoken");
const authService = require("../../services/authService");
const emailService = require("../../services/emailService");
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  AuthenticationError,
} = require("../../utils/errorClasses");

const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT id, nombre, correo, sexo, rol, empresa_id, discapacidad_id, fecha_registro
      FROM users
      WHERE id = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError("Usuario no encontrado"));
    }

    // Si tiene discapacidad, obtener información
    let discapacidades = null;
    if (result.rows[0].discapacidad_id) {
      const discapacidadResult = await pool.query(
        `
        SELECT ud.*, d.nombre as discapacidad_nombre
        FROM user_discapacidades ud
        JOIN discapacidades d ON ud.discapacidad_id = d.id
        WHERE ud.user_id = $1
      `,
        [userId]
      );

      discapacidades = discapacidadResult.rows;
    }

    res.json({
      ...result.rows[0],
      discapacidades,
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar información básica del perfil
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { nombre, sexo } = req.body;

    // Verificar si el usuario existe
    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);

    if (userExists.rows.length === 0) {
      return next(new NotFoundError("Usuario no encontrado"));
    }

    // Actualizar información
    const result = await pool.query(
      `
      UPDATE users
      SET 
        nombre = COALESCE($1, nombre),
        sexo = COALESCE($2, sexo)
      WHERE id = $3
      RETURNING id, nombre, correo, sexo, rol
    `,
      [nombre, sexo, userId]
    );

    res.json({
      message: "Perfil actualizado correctamente",
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const requestEmailChange = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { nuevoCorreo, clave } = req.body;

    const userResult = await pool.query(
      "SELECT id, nombre, correo, clave FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return next(new NotFoundError("Usuario no encontrado"));
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isMatch = await authService.comparePasswords(clave, user.clave);
    if (!isMatch) {
      return next(new AuthenticationError("Contraseña incorrecta"));
    }

    // Verificar que el nuevo correo no esté en uso
    const emailExists = await pool.query(
      "SELECT id FROM users WHERE correo = $1 AND id != $2",
      [nuevoCorreo, userId]
    );

    if (emailExists.rows.length > 0) {
      return next(
        new ConflictError("El correo ya está en uso por otro usuario")
      );
    }

    // Generar token para cambio de correo
    const emailChangeToken = jwt.sign(
      {
        userId: userId,
        currentEmail: user.correo,
        newEmail: nuevoCorreo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Guardar token en la base de datos
    await pool.query(
      `
        UPDATE users
        SET token_verificacion = $1
        WHERE id = $2
      `,
      [emailChangeToken, userId]
    );

    // Enviar correo de verificación
    try {
      await emailService.sendEmailChangeVerification(
        nuevoCorreo,
        user.nombre,
        emailChangeToken
      );

      res.json({
        message:
          "Se ha enviado un enlace de verificación a tu nuevo correo electrónico",
      });
    } catch (emailError) {
      console.error("Error al enviar correo:", emailError);
      res.json({
        message:
          "Solicitud procesada, pero hubo un problema al enviar el correo de verificación",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Confirmar cambio de correo electrónico
const confirmEmailChange = async (req, res, next) => {
  try {
    const { token } = req.params;
    console.log("Token recibido:", token);

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decodificado:", decoded);
    } catch (tokenError) {
      console.error("Error al verificar token:", tokenError.message);
      return next(new AuthenticationError("Token inválido o expirado"));
    }

    const { userId, newEmail } = decoded;

    // Verificar si el token existe en la base de datos
    const tokenCheck = await pool.query(
      `SELECT token_verificacion FROM users WHERE id = $1`,
      [userId]
    );

    console.log("Resultado verificación token en BD:", tokenCheck.rows[0]);

    if (
      tokenCheck.rows.length === 0 ||
      tokenCheck.rows[0].token_verificacion !== token
    ) {
      console.log("Token no coincide o usuario no encontrado");
      return next(new NotFoundError("Token inválido o ya usado"));
    }

    // Actualizar correo
    const result = await pool.query(
      `
          UPDATE users
          SET correo = $1, token_verificacion = NULL
          WHERE id = $2 AND token_verificacion = $3
          RETURNING id, nombre, correo
        `,
      [newEmail, userId, token]
    );

    console.log("Resultado actualización:", result.rows);

    if (result.rows.length === 0) {
      return next(
        new NotFoundError(
          "No se pudo actualizar el correo. Token inválido o ya usado"
        )
      );
    }

    res.json({
      message: "Correo electrónico actualizado correctamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error general:", error);
    next(error);
  }
};

// Cambiar contraseña (estando logueado)
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { claveActual, nuevaClave } = req.body;

    const userResult = await pool.query(
      "SELECT id, clave FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return next(new NotFoundError("Usuario no encontrado"));
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isMatch = await authService.comparePasswords(claveActual, user.clave);
    if (!isMatch) {
      return next(new AuthenticationError("Contraseña actual incorrecta"));
    }

    // Encriptar nueva contraseña
    const hashedPassword = await authService.hashPassword(nuevaClave);

    // Actualizar contraseña
    await pool.query(
      `
      UPDATE users
      SET clave = $1
      WHERE id = $2
    `,
      [hashedPassword, userId]
    );

    res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  requestEmailChange,
  confirmEmailChange,
  changePassword,
};
