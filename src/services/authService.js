const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const findUserByEmail = async (correo) => {
  const result = await pool.query(
    "SELECT id, nombre, correo, clave, verificado, rol, empresa_id FROM users WHERE correo = $1",
    [correo]
  );
  return result.rows[0] || null;
};

const createUser = async (userData) => {
  const {
    nombre,
    correo,
    clave,
    sexo,
    verificado,
    token_verificacion,
    rol = "usuario",
  } = userData;

  const userExists = await pool.query(
    "SELECT id FROM users WHERE correo = $1",
    [correo]
  );

  if (userExists.rows.length > 0) {
    throw new Error("El correo ya está registrado");
  }

  // Insertar usuario en la BD
  const result = await pool.query(
    `INSERT INTO users (nombre, correo, clave, sexo, verificado, token_verificacion, rol) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nombre, correo, rol`,
    [nombre, correo, clave, sexo, verificado, token_verificacion, rol]
  );

  return result.rows[0];
};

const verifyUserToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const { correo } = decoded;

  // Verificar si el token existe en la BD y actualizar usuario
  const result = await pool.query(
    "UPDATE users SET verificado = true, token_verificacion = NULL WHERE correo = $1 RETURNING id",
    [correo]
  );

  if (result.rowCount === 0) {
    throw new Error("Token inválido o ya usado");
  }

  return true;
};

const generateToken = (payload) => {
  const tokenData = {
    id: payload.id,
    correo: payload.correo,
  };

  if (payload.rol) tokenData.rol = payload.rol;
  if (payload.empresa_id) tokenData.empresa_id = payload.empresa_id;

  return jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const comparePasswords = async (inputPassword, hashedPassword) => {
  return bcrypt.compare(inputPassword, hashedPassword);
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const updateUserPassword = async (correo, token, nuevaClave) => {
  const hashedPassword = await hashPassword(nuevaClave);

  const result = await pool.query(
    "UPDATE users SET clave = $1, token_verificacion = NULL WHERE correo = $2 AND token_verificacion = $3 RETURNING id",
    [hashedPassword, correo, token]
  );

  if (result.rowCount === 0) {
    throw new Error("Token inválido o ya usado");
  }

  return true;
};

const storeResetToken = async (correo, token) => {
  const result = await pool.query(
    "UPDATE users SET token_verificacion = $1 WHERE correo = $2 RETURNING id",
    [token, correo]
  );

  if (result.rowCount === 0) {
    throw new Error("Usuario no encontrado");
  }

  return true;
};

module.exports = {
  findUserByEmail,
  createUser,
  verifyUserToken,
  generateToken,
  comparePasswords,
  hashPassword,
  updateUserPassword,
  storeResetToken,
};
