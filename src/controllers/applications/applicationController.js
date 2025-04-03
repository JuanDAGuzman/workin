const pool = require('../../config/db');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../../utils/errorClasses');

const getUserApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT p.*, e.titulo as empleo_titulo, em.nombre as empresa_nombre
      FROM postulaciones p
      JOIN empleos e ON p.empleo_id = e.id
      JOIN empresas em ON e.empresa_id = em.id
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_postulacion DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};



const getJobApplications = async (req, res, next) => {
  try {
    const { empleo_id } = req.params;

    // Verificar si el empleo existe
    const jobResult = await pool.query('SELECT * FROM empleos WHERE id = $1', [
      empleo_id,
    ]);

    if (jobResult.rows.length === 0) {
      return next(new NotFoundError('Empleo no encontrado'));
    }

    const job = jobResult.rows[0];

    // Verificar permisos (solo la empresa propietaria o admin pueden ver las postulaciones)
    if (
      req.user.rol !== 'admin' &&
      (req.user.rol !== 'empresa' || req.user.empresa_id != job.empresa_id)
    ) {
      return next(
        new ForbiddenError('No tienes permiso para ver estas postulaciones')
      );
    }

    const result = await pool.query(
      `
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.correo as usuario_correo,
             u.discapacidad_id,
             d.nombre as discapacidad_nombre,
             (
               SELECT json_agg(json_build_object(
                 'id', ud.id,
                 'discapacidad_id', ud.discapacidad_id,
                 'discapacidad_nombre', disc.nombre,
                 'descripcion', ud.descripcion,
                 'certificado_url', ud.certificado_url,
                 'verificado', ud.verificado
               ))
               FROM user_discapacidades ud
               JOIN discapacidades disc ON ud.discapacidad_id = disc.id
               WHERE ud.user_id = u.id
             ) as discapacidades
      FROM postulaciones p
      JOIN users u ON p.usuario_id = u.id
      LEFT JOIN discapacidades d ON u.discapacidad_id = d.id
      WHERE p.empleo_id = $1
      ORDER BY p.fecha_postulacion DESC
    `,
      [empleo_id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};


const createApplication = async (req, res, next) => {
  try {
    const { empleo_id } = req.body;
    const userId = req.user.id;

    const jobResult = await pool.query('SELECT * FROM empleos WHERE id = $1', [
      empleo_id,
    ]);

    if (jobResult.rows.length === 0) {
      return next(new NotFoundError('Empleo no encontrado'));
    }

    // Verificar si el usuario ya ha aplicado a este empleo
    const existingApp = await pool.query(
      'SELECT id FROM postulaciones WHERE empleo_id = $1 AND usuario_id = $2',
      [empleo_id, userId]
    );

    if (existingApp.rows.length > 0) {
      return next(new ConflictError('Ya has postulado a este empleo'));
    }

    const userDisabilitiesResult = await pool.query(
      'SELECT id FROM user_discapacidades WHERE user_id = $1',
      [userId]
    );

    if (userDisabilitiesResult.rows.length === 0) {
      return next(
        new Error(
          'Debes registrar al menos una discapacidad antes de postularte. Por favor, ve a tu perfil y registra tu discapacidad.'
        )
      );
    }

    // Crear la postulación
    const result = await pool.query(
      `
      INSERT INTO postulaciones (empleo_id, usuario_id, fecha_postulacion, estado)
      VALUES ($1, $2, NOW(), 'pendiente')
      RETURNING *
    `,
      [empleo_id, userId]
    );

    res.status(201).json({
      message: 'Postulación enviada con éxito',
      application: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Estados disponibles
    const estadosValidos = [
      'pendiente',
      'revisando',
      'entrevista',
      'rechazado',
      'aceptado',
    ];
    if (!estadosValidos.includes(estado)) {
      return next(
        new Error(
          `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
        )
      );
    }

    const appResult = await pool.query(
      `
      SELECT p.*, e.empresa_id
      FROM postulaciones p
      JOIN empleos e ON p.empleo_id = e.id
      WHERE p.id = $1
    `,
      [id]
    );

    if (appResult.rows.length === 0) {
      return next(new NotFoundError('Postulación no encontrada'));
    }

    const application = appResult.rows[0];

    // Verificar permisos (solo la empresa propietaria o admin pueden actualizar)
    if (
      req.user.rol !== 'admin' &&
      (req.user.rol !== 'empresa' ||
        req.user.empresa_id != application.empresa_id)
    ) {
      return next(
        new ForbiddenError('No tienes permiso para actualizar esta postulación')
      );
    }

    const result = await pool.query(
      `
      UPDATE postulaciones 
      SET estado = $1
      WHERE id = $2
      RETURNING *
    `,
      [estado, id]
    );

    res.json({
      message: 'Estado de postulación actualizado',
      application: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una postulación (el usuario puede cancelar su postulación)
const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const appResult = await pool.query(
      'SELECT * FROM postulaciones WHERE id = $1',
      [id]
    );

    if (appResult.rows.length === 0) {
      return next(new NotFoundError('Postulación no encontrada'));
    }

    const application = appResult.rows[0];

    // Solo el propietario o un admin pueden eliminar la postulación
    if (req.user.rol !== 'admin' && application.usuario_id !== userId) {
      return next(
        new ForbiddenError('No tienes permiso para eliminar esta postulación')
      );
    }

    // Eliminar postulación
    await pool.query('DELETE FROM postulaciones WHERE id = $1', [id]);

    res.json({ message: 'Postulación eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserApplications,
  getJobApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
};
