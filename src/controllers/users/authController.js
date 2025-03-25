const pool = require("../../config/db");
const authService = require("../../services/authService");
const emailService = require("../../services/emailService");
const {
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
} = require("../../utils/errorClasses");

// Obtener todos los usuarios
const getUsers = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, nombre, correo FROM users");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, nombre, correo FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return next(new NotFoundError("Usuario no encontrado"));
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  const { nombre, correo, clave, sexo } = req.body;

  try {
    // Verificar si el usuario ya existe
    const existingUser = await authService.findUserByEmail(correo);
    if (existingUser) {
      return next(new ConflictError("El correo ya está registrado"));
    }

    // Encriptar contraseña
    const hashedPassword = await authService.hashPassword(clave);

    // Generar un token de verificación
    const verificationToken = authService.generateToken({ correo });

    // Crear el usuario
    const user = await authService.createUser({
      nombre,
      correo,
      clave: hashedPassword,
      sexo,
      verificado: false,
      token_verificacion: verificationToken,
    });

    // Enviar correo de verificación
    try {
      await emailService.sendVerificationEmail(
        correo,
        nombre,
        verificationToken
      );
      res.status(201).json({
        message:
          "Usuario registrado correctamente. Se envió un correo de verificación.",
        user,
      });
    } catch (emailError) {
      console.error("Error al enviar correo:", emailError);
      res.status(201).json({
        message:
          "Usuario registrado correctamente, pero hubo un problema al enviar el correo de verificación.",
        user,
        verificationToken,
      });
    }
  } catch (error) {
    next(error);
  }
};

// En src/controllers/users/authController.js - función loginUser
const loginUser = async (req, res, next) => {
  const { correo, clave } = req.body;

  try {
    const user = await authService.findUserByEmail(correo);

    if (!user) {
      return next(new AuthenticationError("Correo o contraseña incorrectos"));
    }

    // Verificar si el usuario está verificado
    if (!user.verificado) {
      return next(
        new ForbiddenError("Debe verificar su cuenta para iniciar sesión")
      );
    }

    // Comparar contraseñas
    const isMatch = await authService.comparePasswords(clave, user.clave);
    if (!isMatch) {
      return next(new AuthenticationError("Correo o contraseña incorrectos"));
    }

    // Crear token JWT
    const token = authService.generateToken({
      id: user.id,
      correo: user.correo,
      rol: user.rol,
      empresa_id: user.empresa_id,
    });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        empresa_id: user.empresa_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  const { token } = req.params;
  try {
    await authService.verifyUserToken(token);
    res.json({
      message: "Cuenta verificada con éxito. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    next(new AuthenticationError("Token inválido o expirado"));
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  loginUser,
  verifyUser,
};
