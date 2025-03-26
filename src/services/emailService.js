const nodemailer = require("nodemailer");

// Configurar el transportador para Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
const sendEmailChangeVerification = async (nuevoCorreo, nombre, token) => {
  try {
    const verificationLink = `http://localhost:5000/api/users/profile/confirm-email/${token}`;

    const info = await transporter.sendMail({
      from: '"WorkIN" <noreply@workin.com>',
      to: nuevoCorreo,
      subject: "Confirma tu nuevo correo electrónico - WorkIN",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #4a4a4a;">Cambio de correo electrónico</h1>
          <p>Hola ${nombre}, has solicitado cambiar tu correo electrónico en WorkIN.</p>
          <p>Para confirmar este cambio, haz clic en el siguiente enlace:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">Confirmar cambio de correo</a>
          </p>
          <p>O copia y pega la siguiente URL en tu navegador:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${verificationLink}</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo y tu correo seguirá siendo el mismo.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">Este correo fue enviado automáticamente, por favor no respondas a este mensaje.</p>
        </div>
      `,
    });

    console.log("Correo de cambio de email enviado con éxito a:", nuevoCorreo);
    console.log("ID del mensaje:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error al enviar correo de cambio de email:", error);
    throw error;
  }
};

// Enviar correo de verificación
const sendVerificationEmail = async (correo, nombre, token) => {
  try {
    const verificationLink = `http://localhost:5000/api/users/verify/${token}`;

    const info = await transporter.sendMail({
      from: '"WorkIN" <noreply@workin.com>',
      to: correo,
      subject: "Verifica tu cuenta en WorkIN",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #4a4a4a;">Bienvenido a WorkIN</h1>
          <p>Hola ${nombre}, gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">Verificar mi cuenta</a>
          </p>
          <p>O copia y pega la siguiente URL en tu navegador:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${verificationLink}</p>
          <p>Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">Este correo fue enviado automáticamente, por favor no respondas a este mensaje.</p>
        </div>
      `,
    });

    console.log("Correo enviado con éxito a:", correo);
    console.log("ID del mensaje:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error al enviar correo:", error);
    throw error;
  }
};

// Enviar correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (correo, nombre, token) => {
  try {
    const resetLink = `http://localhost:5000/restablecer-password/${token}`;

    const info = await transporter.sendMail({
      from: '"WorkIN" <noreply@workin.com>',
      to: correo,
      subject: "Restablecimiento de contraseña - WorkIN",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #4a4a4a;">Restablecimiento de contraseña</h1>
          <p>Hola ${nombre}, recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
          </p>
          <p>O copia y pega la siguiente URL en tu navegador:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${resetLink}</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.</p>
          <p>Este enlace caducará en 1 hora por razones de seguridad.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">Este correo fue enviado automáticamente, por favor no respondas a este mensaje.</p>
        </div>
      `,
    });

    console.log("Correo de restablecimiento enviado con éxito a:", correo);
    console.log("ID del mensaje:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error al enviar correo de restablecimiento:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
};
