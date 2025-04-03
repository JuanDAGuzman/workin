const pool = require('../../config/db');
const { NotFoundError, ForbiddenError } = require('../../utils/errorClasses');

const getAllDisabilities = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT * FROM discapacidades
      ORDER BY nombre
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getDisabilityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM discapacidades
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Discapacidad no encontrada'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createDisability = async (req, res, next) => {
  try {
    const { nombre } = req.body;

    // Solo administradores pueden crear nuevas discapacidades
    if (req.user.rol !== 'admin') {
      return next(
        new ForbiddenError('No tienes permiso para crear discapacidades')
      );
    }

    const result = await pool.query(
      `
      INSERT INTO discapacidades (nombre)
      VALUES ($1)
      RETURNING *
    `,
      [nombre]
    );

    res.status(201).json({
      message: 'Discapacidad creada correctamente',
      disability: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDisabilities,
  getDisabilityById,
  createDisability,
};
