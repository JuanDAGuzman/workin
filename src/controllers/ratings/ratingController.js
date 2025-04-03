const pool = require('../../config/db');
const {
  NotFoundError,
  ForbiddenError,
  /*ConflictError,*/
} = require('../../utils/errorClasses');

const getCompanyRatings = async (req, res, next) => {
  try {
    const { empresa_id } = req.params;

    const companyResult = await pool.query(
      'SELECT * FROM empresas WHERE id = $1',
      [empresa_id]
    );

    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }

    // Obtener las valoraciones
    const ratingsResult = await pool.query(
      `
      SELECT v.*, u.nombre as usuario_nombre
      FROM valoraciones v
      JOIN users u ON v.usuario_id = u.id
      WHERE v.empresa_id = $1
      ORDER BY v.fecha_creacion DESC
    `,
      [empresa_id]
    );

    // Calcular calificación promedio
    const avgResult = await pool.query(
      `
      SELECT AVG(calificacion) as promedio
      FROM valoraciones
      WHERE empresa_id = $1
    `,
      [empresa_id]
    );

    res.json({
      empresa: companyResult.rows[0],
      valoraciones: ratingsResult.rows,
      promedio: parseFloat(avgResult.rows[0].promedio) || 0,
    });
  } catch (error) {
    next(error);
  }
};

const getUserRatings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT v.*, e.nombre as empresa_nombre
      FROM valoraciones v
      JOIN empresas e ON v.empresa_id = e.id
      WHERE v.usuario_id = $1
      ORDER BY v.fecha_creacion DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const createOrUpdateRating = async (req, res, next) => {
  try {
    const { empresa_id, calificacion, comentario } = req.body;
    const userId = req.user.id;

    const companyResult = await pool.query(
      'SELECT * FROM empresas WHERE id = $1',
      [empresa_id]
    );

    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }

    // Verificar si el usuario ya ha valorado esta empresa
    const existingRating = await pool.query(
      'SELECT id FROM valoraciones WHERE empresa_id = $1 AND usuario_id = $2',
      [empresa_id, userId]
    );

    let result;
    if (existingRating.rows.length > 0) {
      // Actualizar valoración existente
      result = await pool.query(
        `
        UPDATE valoraciones
        SET calificacion = $1, comentario = $2, fecha_creacion = NOW()
        WHERE empresa_id = $3 AND usuario_id = $4
        RETURNING *
      `,
        [calificacion, comentario, empresa_id, userId]
      );

      // Actualizar calificación promedio en la tabla empresas
      await updateCompanyRating(empresa_id);

      res.json({
        message: 'Valoración actualizada correctamente',
        rating: result.rows[0],
      });
    } else {
      // Crear nueva valoración
      result = await pool.query(
        `
        INSERT INTO valoraciones (usuario_id, empresa_id, calificacion, comentario, fecha_creacion)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `,
        [userId, empresa_id, calificacion, comentario]
      );

      // Actualizar calificación promedio en la tabla empresas
      await updateCompanyRating(empresa_id);

      res.status(201).json({
        message: 'Valoración creada correctamente',
        rating: result.rows[0],
      });
    }
  } catch (error) {
    next(error);
  }
};

const deleteRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ratingResult = await pool.query(
      'SELECT * FROM valoraciones WHERE id = $1',
      [id]
    );

    if (ratingResult.rows.length === 0) {
      return next(new NotFoundError('Valoración no encontrada'));
    }

    const rating = ratingResult.rows[0];

    if (req.user.rol !== 'admin' && rating.usuario_id !== userId) {
      return next(
        new ForbiddenError('No tienes permiso para eliminar esta valoración')
      );
    }

    await pool.query('DELETE FROM valoraciones WHERE id = $1', [id]);

    await updateCompanyRating(rating.empresa_id);

    res.json({ message: 'Valoración eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

const updateCompanyRating = async (empresaId) => {
  try {
    // Calcular promedio
    const avgResult = await pool.query(
      `
      SELECT AVG(calificacion) as promedio
      FROM valoraciones
      WHERE empresa_id = $1
    `,
      [empresaId]
    );

    const promedio = parseFloat(avgResult.rows[0].promedio) || 0;

    // Actualizar la empresa
    await pool.query(
      `
      UPDATE empresas
      SET calificacion = $1
      WHERE id = $2
    `,
      [promedio, empresaId]
    );

    return promedio;
  } catch (error) {
    console.error('Error al actualizar calificación de empresa:', error);
    throw error;
  }
};

module.exports = {
  getCompanyRatings,
  getUserRatings,
  createOrUpdateRating,
  deleteRating,
};
