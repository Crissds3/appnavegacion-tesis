import nodemailer from 'nodemailer';

// Configuración del transportador de correo (Gmail SMTP)
const crearTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const enviarEmailRecuperacion = async (opciones) => {
  try {
    const transporter = crearTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@tuapp.com',
      to: opciones.email,
      subject: opciones.subject,
      // Declaración explícita de charset UTF-8 para evitar caracteres corruptos
      alternatives: [
        {
          contentType: 'text/html; charset=utf-8',
          content: opciones.html
        }
      ]
    };

    console.log('Intentando enviar correo a:', opciones.email);
    console.log('Desde:', process.env.EMAIL_FROM);

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error detallado al enviar correo:');
    console.error('Mensaje:', error.message);
    console.error('Codigo:', error.code);
    console.error('Response:', error.response);
    throw new Error('No se pudo enviar el correo electronico: ' + error.message);
  }
};

// Template HTML para el correo de recuperación
export const crearEmailRecuperacion = (nombre, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #333333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content p {
          color: #666666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 15px 35px;
          background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
        }
        .warning {
          background-color: #FFF3CD;
          border-left: 4px solid #FFC107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning p {
          color: #856404;
          margin: 0;
          font-size: 14px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #999999;
        }
        .divider {
          height: 1px;
          background-color: #eeeeee;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperaci&#243;n de Contrase&#241;a</h1>
        </div>
        <div class="content">
          <h2>Hola ${nombre},</h2>
          <p>
            Hemos recibido una solicitud para restablecer la contrase&#241;a de tu cuenta.
            Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
          </p>
          <p>
            Para restablecer tu contrase&#241;a, haz clic en el siguiente bot&#243;n:
          </p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: #ffffff !important;">Restablecer Contrase&#241;a</a>
          </div>
          <p style="font-size: 14px; color: #999999; margin-top: 20px;">
            Si el bot&#243;n no funciona, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="font-size: 14px; word-break: break-all; color: #666666;">
            ${resetUrl}
          </p>
          <div class="warning">
            <p><strong>&#9888;&#65039; Importante:</strong> Este enlace es v&#225;lido solo por 1 hora y puede ser usado una &#250;nica vez.</p>
          </div>
          <div class="divider"></div>
          <p style="font-size: 14px; color: #999999;">
            Si no solicitaste restablecer tu contrase&#241;a, por favor ignora este correo o contacta al administrador si tienes dudas.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Sistema de Navegaci&#243;n Universitaria</p>
          <p>Este es un correo autom&#225;tico, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const enviarEmail = async (opciones) => {
  return enviarEmailRecuperacion(opciones);
};

// Template HTML para bienvenida de nuevo usuario (envía link de configuración, no contraseña)
export const crearEmailBienvenida = (nombre, setupUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #E53935 0%, #C62828 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333333; font-size: 24px; margin-bottom: 20px; }
        .content p { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .warning { background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning p { color: #856404; margin: 0; font-size: 14px; }
        .button { display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #E53935 0%, #C62828 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 14px; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenido/a al Sistema</h1>
        </div>
        <div class="content">
          <h2>Hola, ${nombre}</h2>
          <p>Se ha creado una nueva cuenta de administrador para ti en la App de Navegaci&#243;n UTalca.</p>
          <p>Para configurar tu contrase&#241;a y acceder al sistema, haz clic en el siguiente bot&#243;n:</p>
          <div style="text-align: center;">
            <a href="${setupUrl}" class="button" style="color: #ffffff !important;">Configurar mi contrase&#241;a</a>
          </div>
          <p style="font-size: 14px; color: #999999; margin-top: 20px;">
            Si el bot&#243;n no funciona, copia y pega este enlace en tu navegador:
          </p>
          <p style="font-size: 13px; word-break: break-all; color: #666666;">${setupUrl}</p>
          <div class="warning">
            <p><strong>&#9888;&#65039; Importante:</strong> Este enlace es v&#225;lido por 48 horas y solo puede usarse una vez.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} App Navegaci&#243;n UTalca. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template HTML para actualización de perfil
export const crearEmailActualizacionPerfil = (nombre, cambios) => {
  const listaCambios = Object.entries(cambios)
    .map(([campo, valor]) => `<li><strong>${campo}:</strong> ${valor}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #E53935 0%, #C62828 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333333; font-size: 24px; margin-bottom: 20px; }
        .content p { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .changes { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .changes ul { margin: 0; padding-left: 20px; }
        .changes li { margin-bottom: 10px; color: #333; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 14px; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Actualizaci&#243;n de Perfil</h1>
        </div>
        <div class="content">
          <h2>Hola, ${nombre}</h2>
          <p>Te informamos que los datos de tu cuenta han sido actualizados por un administrador.</p>
          <p>Los siguientes campos fueron modificados:</p>
          <div class="changes">
            <ul>
              ${listaCambios}
            </ul>
          </div>
          <p>Si no reconoces estos cambios, por favor contacta al administrador principal inmediatamente.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} App Navegaci&#243;n UTalca. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template HTML para notificación de cambio de contraseña por admin (sin incluir la contraseña)
export const crearEmailCambioPasswordAdmin = (nombre, recuperacionUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #E53935 0%, #C62828 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333333; font-size: 24px; margin-bottom: 20px; }
        .content p { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .warning { background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning p { color: #856404; margin: 0; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #E53935; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 14px; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Contrase&#241;a Actualizada</h1>
        </div>
        <div class="content">
          <h2>Hola, ${nombre}</h2>
          <p>Un administrador ha restablecido la contrase&#241;a de tu cuenta.</p>
          <p>Si no reconoces esta acci&#243;n o necesitas recuperar el acceso, solicita un enlace de recuperaci&#243;n:</p>
          <div style="text-align: center;">
            <a href="${recuperacionUrl}" class="button" style="color: #ffffff !important;">Recuperar contrase&#241;a</a>
          </div>
          <div class="warning">
            <p><strong>&#9888;&#65039; Si no solicitaste este cambio</strong>, contacta al administrador principal inmediatamente.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} App Navegaci&#243;n UTalca. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default {
  enviarEmailRecuperacion,
  crearEmailRecuperacion,
  enviarEmail,
  crearEmailBienvenida,
  crearEmailActualizacionPerfil,
  crearEmailCambioPasswordAdmin
};
