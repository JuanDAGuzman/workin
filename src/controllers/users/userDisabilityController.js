const pool = require("../../config/db");
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../../utils/errorClasses");

const getUserDisabilities = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT ud.*, d.nombre as discapacidad_nombre
      FROM user_discapacidades ud
      JOIN discapacidades d ON ud.discapacidad_id = d.id
      WHERE ud.user_id = $1
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Obtener discapacidades de un usuario específico (para empresas)
const getUserDisabilitiesById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (
      req.user.rol !== "admin" &&
      req.user.rol !== "empresa" &&
      req.user.id != id
    ) {
      return next(
        new ForbiddenError("No tienes permiso para ver esta información")
      );
    }

    const result = await pool.query(
      `
      SELECT ud.*, d.nombre as discapacidad_nombre
      FROM user_discapacidades ud
      JOIN discapacidades d ON ud.discapacidad_id = d.id
      WHERE ud.user_id = $1
    `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Registrar una discapacidad para el usuario
const registerUserDisability = async (req, res, next) => {
  try {
    const { discapacidad_id, descripcion, certificado_url } = req.body;
    const userId = req.user.id;

    const disabilityExists = await pool.query(
      "SELECT id FROM discapacidades WHERE id = $1",
      [discapacidad_id]
    );

    if (disabilityExists.rows.length === 0) {
      return next(new NotFoundError("Discapacidad no encontrada"));
    }

    const existingRecord = await pool.query(
      "SELECT id FROM user_discapacidades WHERE user_id = $1 AND discapacidad_id = $2",
      [userId, discapacidad_id]
    );

    if (existingRecord.rows.length > 0) {
      return next(new ConflictError("Ya tienes registrada esta discapacidad"));
    }

    // Registrar la discapacidad
    const result = await pool.query(
      `
      INSERT INTO user_discapacidades (user_id, discapacidad_id, descripcion, certificado_url, fecha_registro)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `,
      [userId, discapacidad_id, descripcion, certificado_url]
    );

    // Actualizar el campo discapacidad_id en la tabla users
    await pool.query(
      `
      UPDATE users
      SET discapacidad_id = $1
      WHERE id = $2
    `,
      [discapacidad_id, userId]
    );

    res.status(201).json({
      message: "Discapacidad registrada correctamente",
      userDisability: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar información de discapacidad del usuario
const updateUserDisability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { descripcion, certificado_url } = req.body;
    const userId = req.user.id;

    // Verificar si existe el registro
    const recordResult = await pool.query(
      "SELECT * FROM user_discapacidades WHERE id = $1",
      [id]
    );

    if (recordResult.rows.length === 0) {
      return next(new NotFoundError("Registro de discapacidad no encontrado"));
    }

    const record = recordResult.rows[0];

    // Verificar permisos
    if (record.user_id !== userId && req.user.rol !== "admin") {
      return next(
        new ForbiddenError("No tienes permiso para modificar este registro")
      );
    }

    // Actualizar registro
    const result = await pool.query(
      `
      UPDATE user_discapacidades
      SET descripcion = COALESCE($1, descripcion),
          certificado_url = COALESCE($2, certificado_url)
      WHERE id = $3
      RETURNING *
    `,
      [descripcion, certificado_url, id]
    );

    res.json({
      message: "Información de discapacidad actualizada",
      userDisability: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const deleteUserDisability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const recordResult = await pool.query(
      "SELECT * FROM user_discapacidades WHERE id = $1",
      [id]
    );

    if (recordResult.rows.length === 0) {
      return next(new NotFoundError("Registro de discapacidad no encontrado"));
    }

    const record = recordResult.rows[0];

    if (record.user_id !== userId && req.user.rol !== "admin") {
      return next(
        new ForbiddenError("No tienes permiso para eliminar este registro")
      );
    }

    await pool.query("DELETE FROM user_discapacidades WHERE id = $1", [id]);

    // Si el usuario tenía esta discapacidad como principal, actualizar a NULL
    await pool.query(
      `
      UPDATE users
      SET discapacidad_id = NULL
      WHERE id = $1 AND discapacidad_id = $2
    `,
      [userId, record.discapacidad_id]
    );

    res.json({ message: "Registro de discapacidad eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

const quickVerifyUserDisability = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Solo administradores pueden verificar discapacidades
    if (req.user.rol !== 'admin') {
      return next(new ForbiddenError('No tienes permiso para verificar discapacidades'));
    }
    
    const recordExists = await pool.query(
      'SELECT id FROM user_discapacidades WHERE id = $1',
      [id]
    );
    
    if (recordExists.rows.length === 0) {
      return next(new NotFoundError('Registro de discapacidad no encontrado'));
    }
    
    // Marcar como verificado
    const result = await pool.query(`
      UPDATE user_discapacidades
      SET verificado = true
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    res.json({
      message: 'Discapacidad verificada correctamente',
      userDisability: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDisabilities,
  getUserDisabilitiesById,
  registerUserDisability,
  updateUserDisability,
  deleteUserDisability,
  quickVerifyUserDisability,
};
