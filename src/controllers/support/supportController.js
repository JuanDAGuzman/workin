const pool = require('../../config/db');
const { NotFoundError, ForbiddenError } = require('../../utils/errorClasses');

// Obtener todas las solicitudes de soporte (solo para administradores)
const getAllSupportRequests = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') {
      return next(new ForbiddenError('No tienes permiso para ver todas las solicitudes de soporte'));
    }
    
    const result = await pool.query(`
      SELECT s.*, u.nombre as usuario_nombre, u.correo as usuario_correo, u.rol as usuario_rol
      FROM solicitudes_soporte s
      JOIN users u ON s.usuario_id = u.id
      ORDER BY s.fecha_envio DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Obtener las solicitudes de soporte del usuario actual
const getUserSupportRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM solicitudes_soporte
      WHERE usuario_id = $1
      ORDER BY fecha_envio DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Crear una nueva solicitud de soporte
const createSupportRequest = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(`
      INSERT INTO solicitudes_soporte (usuario_id, motivo, fecha_envio)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [userId, motivo]);
    
    res.status(201).json({
      message: 'Solicitud de soporte enviada correctamente',
      supportRequest: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Responder a una solicitud de soporte (solo administradores)
const respondToSupportRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;
    
    // Verificar si es administrador
    if (req.user.rol !== 'admin') {
      return next(new ForbiddenError('No tienes permiso para responder solicitudes de soporte'));
    }
    
    // Verificar si la solicitud existe
    const requestExists = await pool.query(
      'SELECT id FROM solicitudes_soporte WHERE id = $1',
      [id]
    );
    
    if (requestExists.rows.length === 0) {
      return next(new NotFoundError('Solicitud de soporte no encontrada'));
    }
    
    const result = await pool.query(`
      UPDATE solicitudes_soporte
      SET respuesta = $1, fecha_respuesta = NOW(), estado = 'respondida'
      WHERE id = $2
      RETURNING *
    `, [respuesta, id]);
    
    const supportRequest = await pool.query(
      'SELECT usuario_id FROM solicitudes_soporte WHERE id = $1',
      [id]
    );
    
    await pool.query(`
      INSERT INTO mensajes (remitente_id, destinatario_id, contenido, fecha_envio)
      VALUES ($1, $2, $3, NOW())
    `, [req.user.id, supportRequest.rows[0].usuario_id, `Respuesta a tu solicitud de soporte: ${respuesta}`]);
    
    res.json({
      message: 'Respuesta enviada correctamente',
      supportRequest: result ? result.rows[0] : null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSupportRequests,
  getUserSupportRequests,
  createSupportRequest,
  respondToSupportRequest
};