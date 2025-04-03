const pool = require('../../config/db');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../../utils/errorClasses');

const getCompanies = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, fecha_creacion, calificacion 
      FROM empresas
      ORDER BY nombre
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, nombre, fecha_creacion, calificacion
      FROM empresas
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }

    const jobsResult = await pool.query(
      `
      SELECT id, titulo, descripcion, fecha_publicacion
      FROM empleos
      WHERE empresa_id = $1
      ORDER BY fecha_publicacion DESC
    `,
      [id]
    );

    const company = {
      ...result.rows[0],
      empleos: jobsResult.rows,
    };

    res.json(company);
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  const { nombre } = req.body;
  const userId = req.user.id;

  try {
    // Verificar si ya existe una empresa con el mismo nombre
    const existingCompany = await pool.query(
      'SELECT id FROM empresas WHERE nombre = $1',
      [nombre]
    );

    if (existingCompany.rows.length > 0) {
      return next(new ConflictError('Ya existe una empresa con este nombre'));
    }

    await pool.query('BEGIN');

    try {
      // Crear la empresa (con verificada = false por defecto)
      const companyResult = await pool.query(
        `
        INSERT INTO empresas (nombre, fecha_creacion, verificada)
        VALUES ($1, NOW(), false)
        RETURNING id, nombre, fecha_creacion, verificada
      `,
        [nombre]
      );

      const company = companyResult.rows[0];

      await pool.query(
        `
        UPDATE users
        SET rol = 'empresa', empresa_id = $1
        WHERE id = $2
      `,
        [company.id, userId]
      );

      // Confirmar la transacción
      await pool.query('COMMIT');

      res.status(201).json({
        message:
          'Empresa creada correctamente. Un administrador verificará tu empresa pronto.',
        company,
      });
    } catch (error) {
      // Revertir la transacción en caso de error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
const verifyCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificada } = req.body;

    // Solo administradores pueden verificar empresas
    if (req.user.rol !== 'admin') {
      return next(
        new ForbiddenError('No tienes permiso para verificar empresas')
      );
    }

    const companyResult = await pool.query(
      'SELECT * FROM empresas WHERE id = $1',
      [id]
    );

    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }

    const result = await pool.query(
      `
      UPDATE empresas
      SET verificada = $1
      WHERE id = $2
      RETURNING *
    `,
      [verificada, id]
    );

    res.json({
      message: verificada
        ? 'Empresa verificada correctamente'
        : 'Verificación de empresa removida',
      company: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una empresa
const updateCompany = async (req, res, next) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const companyResult = await pool.query(
      'SELECT id FROM empresas WHERE id = $1',
      [id]
    );

    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }

    // Verificar permisos (solo el propietario o admin puede actualizar)
    if (
      req.user.rol !== 'admin' &&
      (req.user.rol !== 'empresa' || req.user.empresa_id != id)
    ) {
      return next(
        new ForbiddenError('No tiene permisos para actualizar esta empresa')
      );
    }

    const result = await pool.query(
      `
      UPDATE empresas
      SET nombre = COALESCE($1, nombre)
      WHERE id = $2
      RETURNING id, nombre, fecha_creacion
    `,
      [nombre, id]
    );

    res.json({
      message: 'Empresa actualizada correctamente',
      company: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una empresa (solo admin)
const deleteCompany = async (req, res, next) => {
  const { id } = req.params;

  try {
    const companyResult = await pool.query(
      'SELECT id FROM empresas WHERE id = $1',
      [id]
    );

    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }

    // Solo administradores pueden eliminar empresas
    if (req.user.rol !== 'admin') {
      return next(
        new ForbiddenError('No tiene permisos para eliminar empresas')
      );
    }

    await pool.query('DELETE FROM empresas WHERE id = $1', [id]);

    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  verifyCompany,
};
