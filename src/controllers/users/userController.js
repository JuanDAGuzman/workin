const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;

    // Llamar al procedimiento almacenado
    const query = 'SELECT * FROM get_user_by_email($1)';
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    // Copiar el objeto usuario sin incluir la contraseña
    const userWithoutPassword = { ...result.rows[0] };
    delete userWithoutPassword.password;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserByEmail
};