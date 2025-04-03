const pool = require('../../config/db');
const crypto = require('crypto');
const {
  NotFoundError,
  ForbiddenError,
  /*ConflictError*/
} = require('../../utils/errorClasses');

// Generar código de invitación para administrador (solo superadmin)
const generateAdminInviteCode = async (req, res, next) => {
  try {
    // Solo superadmin puede generar estos códigos
    if (req.user.rol !== 'admin') {
      return next(
        new ForbiddenError(
          'No tienes permiso para generar códigos de invitación'
        )
      );
    }

    // Generar código único
    const inviteCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

    // Guardar código en la base de datos
    await pool.query(
      `
      INSERT INTO admin_invite_codes (code, expiry_date, created_by)
      VALUES ($1, $2, $3)
    `,
      [inviteCode, expiresAt, req.user.id]
    );

    res.json({
      message: 'Código de invitación generado correctamente',
      inviteCode,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

const activateAdminRole = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // Verificar si el código existe y es válido
    const codeResult = await pool.query(
      `
      SELECT * FROM admin_invite_codes
      WHERE code = $1 AND used = false AND expiry_date > NOW()
    `,
      [inviteCode]
    );

    if (codeResult.rows.length === 0) {
      return next(
        new NotFoundError('Código de invitación inválido o expirado')
      );
    }

    // Actualizar usuario a rol de admin
    await pool.query(
      `
      UPDATE users
      SET rol = 'admin'
      WHERE id = $1
    `,
      [userId]
    );

    // Marcar código como usado
    await pool.query(
      `
      UPDATE admin_invite_codes
      SET used = true, used_by = $1, used_at = NOW()
      WHERE code = $2
    `,
      [userId, inviteCode]
    );

    res.json({
      message: 'Rol de administrador activado correctamente',
      rol: 'admin',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAdminInviteCode,
  activateAdminRole,
};
