import nodemailer from 'nodemailer';
import { config } from '../configs/config.js';

// Configurar el transportador de email (aligned with .NET SmtpSettings)
const createTransporter = () => {
  if (!config.smtp.username || !config.smtp.password) {
    console.warn(
      'SMTP credentials not configured. Email functionality will not work.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // true para 465, false para 587
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    // Evitar que las peticiones HTTP queden colgadas si SMTP no responde
    connectionTimeout: 10_000, // 10s
    greetingTimeout: 10_000, // 10s
    socketTimeout: 10_000, // 10s
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

export const sendVerificationEmail = async (email, name, verificationToken) => {
  if (!transporter) {
    throw new Error('El transportador SMTP no está configurado');
  }

  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Verifica tu dirección de correo electrónico',
      html: `
        <h2>¡Bienvenido/a ${name}!</h2>
        <p>Por favor, verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:</p>
        <a href='${verificationUrl}' style='background-color: antiquewhite; color: grey; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
            Verificar correo
        </a>
        <p>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
        <p>${verificationUrl}</p>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no creaste una cuenta, por favor ignora este correo.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar el correo de verificación:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  if (!transporter) {
    throw new Error('El transportador SMTP no está configurado');
  }

  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Restablece tu contraseña',
      html: `
        <h2>Solicitud de restablecimiento de contraseña</h2>
        <p>Hola ${name},</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
        <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
            Restablecer contraseña
        </a>
        <p>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
        <p>${resetUrl}</p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar el correo de restablecimiento de contraseña:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('El transportador SMTP no está configurado');
  }

  try {
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: '¡Bienvenido/a a AuthDotnet!',
      html: `
        <h2>¡Bienvenido/a a AuthDotnet, ${name}!</h2>
        <p>Tu cuenta ha sido verificada y activada exitosamente.</p>
        <p>Ahora puedes disfrutar de todas las funciones de nuestra plataforma.</p>
        <p>Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.</p>
        <p>¡Gracias por unirte a nosotros!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar el correo de bienvenida:', error);
    throw error;
  }
};

export const sendPasswordChangedEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('El transportador SMTP no está configurado');
  }

  try {
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Contraseña cambiada exitosamente',
      html: `
        <h2>Contraseña cambiada</h2>
        <p>Hola ${name},</p>
        <p>Tu contraseña ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte inmediatamente.</p>
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar el correo de cambio de contraseña:', error);
    throw error;
  }
};
