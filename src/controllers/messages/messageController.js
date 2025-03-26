const pool = require('../../config/db');
const { NotFoundError, ForbiddenError } = require('../../utils/errorClasses');

// Obtener conversación entre dos usuarios
const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // Obtener mensajes de la conversación (enviados y recibidos)
    const result = await pool.query(`
      SELECT m.*,
             remitente.nombre as remitente_nombre,
             destinatario.nombre as destinatario_nombre
      FROM mensajes m
      JOIN users remitente ON m.remitente_id = remitente.id
      JOIN users destinatario ON m.destinatario_id = destinatario.id
      WHERE (m.remitente_id = $1 AND m.destinatario_id = $2)
         OR (m.remitente_id = $2 AND m.destinatario_id = $1)
      ORDER BY m.fecha_envio ASC
    `, [currentUserId, userId]);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Obtener la lista de usuarios con los que ha conversado
    const result = await pool.query(`
      WITH conversacion_usuarios AS (
        SELECT DISTINCT
          CASE
            WHEN remitente_id = $1 THEN destinatario_id
            ELSE remitente_id
          END AS otro_usuario_id
        FROM mensajes
        WHERE remitente_id = $1 OR destinatario_id = $1
      )
      SELECT 
        u.id, 
        u.nombre, 
        u.correo,
        u.rol,
        (
          SELECT contenido 
          FROM mensajes 
          WHERE (remitente_id = $1 AND destinatario_id = u.id) 
             OR (remitente_id = u.id AND destinatario_id = $1)
          ORDER BY fecha_envio DESC 
          LIMIT 1
        ) as ultimo_mensaje,
        (
          SELECT fecha_envio 
          FROM mensajes 
          WHERE (remitente_id = $1 AND destinatario_id = u.id) 
             OR (remitente_id = u.id AND destinatario_id = $1)
          ORDER BY fecha_envio DESC 
          LIMIT 1
        ) as fecha_ultimo_mensaje
      FROM conversacion_usuarios cu
      JOIN users u ON cu.otro_usuario_id = u.id
      ORDER BY fecha_ultimo_mensaje DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { destinatario_id, contenido } = req.body;
    const remitente_id = req.user.id;
    
    // Verificar si el destinatario existe
    const userExists = await pool.query(
      'SELECT id, rol, empresa_id FROM users WHERE id = $1',
      [destinatario_id]
    );
    
    if (userExists.rows.length === 0) {
      return next(new NotFoundError('Usuario destinatario no encontrado'));
    }
    
    const destinatario = userExists.rows[0];
    
    // Verificar si hay una postulación entre ellos (si el remitente es empresa y el destinatario usuario)
    if (req.user.rol === 'empresa' && destinatario.rol === 'usuario') {
      const applicationExists = await pool.query(`
        SELECT p.id
        FROM postulaciones p
        JOIN empleos e ON p.empleo_id = e.id
        WHERE p.usuario_id = $1 AND e.empresa_id = $2
      `, [destinatario_id, req.user.empresa_id]);
      
      if (applicationExists.rows.length === 0) {
        return next(new ForbiddenError('No puedes enviar mensajes a usuarios que no han postulado a tu empresa'));
      }
    }
    
    // Verificar si hay una postulación entre ellos (si el remitente es usuario y el destinatario empresa)
    if (req.user.rol === 'usuario' && destinatario.rol === 'empresa') {
      const applicationExists = await pool.query(`
        SELECT p.id
        FROM postulaciones p
        JOIN empleos e ON p.empleo_id = e.id
        WHERE p.usuario_id = $1 AND e.empresa_id = $2
      `, [remitente_id, destinatario.empresa_id]);
      
      if (applicationExists.rows.length === 0) {
        return next(new ForbiddenError('No puedes enviar mensajes a empresas a las que no has postulado'));
      }
    }
    
    const result = await pool.query(`
      INSERT INTO mensajes (remitente_id, destinatario_id, contenido, fecha_envio)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [remitente_id, destinatario_id, contenido]);
    
    res.status(201).json({
      message: 'Mensaje enviado correctamente',
      mensaje: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversation,
  getUserConversations,
  sendMessage
};