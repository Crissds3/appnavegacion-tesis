import nodemailer from 'nodemailer';

// Configuración del transportador de correo
const crearTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
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
      html: opciones.html
    };

    console.log('Intentando enviar correo a:', opciones.email);
    console.log('Desde:', process.env.EMAIL_FROM);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error detallado al enviar correo:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Response:', error.response);
    throw new Error('No se pudo enviar el correo electrónico: ' + error.message);
  }
};

// Template HTML para el correo de recuperación
export const crearEmailRecuperacion = (nombre, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
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
          transition: transform 0.3s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          color: #ffffff !important;
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
          <h1>Recuperación de Contraseña</h1>
        </div>
        <div class="content">
          <h2>Hola ${nombre},</h2>
          <p>
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
            Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
          </p>
          <p>
            Para restablecer tu contraseña, haz clic en el siguiente botón:
          </p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: #ffffff !important;">Restablecer Contraseña</a>
          </div>
          <p style="font-size: 14px; color: #999999; margin-top: 20px;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="font-size: 14px; word-break: break-all; color: #666666;">
            ${resetUrl}
          </p>
          <div class="warning">
            <p><strong>⚠️ Importante:</strong> Este enlace es válido solo por 1 hora y puede ser usado una única vez.</p>
          </div>
          <div class="divider"></div>
          <p style="font-size: 14px; color: #999999;">
            Si no solicitaste restablecer tu contraseña, por favor ignora este correo o contacta al administrador si tienes dudas.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sistema de Navegación Universitaria</p>
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const enviarEmail = async (opciones) => {
  return enviarEmailRecuperacion(opciones);
};

// Template HTML para bienvenida de nuevo usuario
export const crearEmailBienvenida = (nombre, email, password, loginUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #E53935 0%, #C62828 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333333; font-size: 24px; margin-bottom: 20px; }
        .content p { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .credentials { background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #E53935; margin: 20px 0; }
        .credentials p { margin: 5px 0; font-family: monospace; font-size: 16px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #E53935; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
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
          <p>Se ha creado una nueva cuenta de administrador para ti en la App de Navegación UTalca.</p>
          <p>Tus credenciales de acceso son:</p>
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña:</strong> ${password}</p>
          </div>
          <p>Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Iniciar Sesión</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} App Navegación UTalca. Todos los derechos reservados.</p>
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
          <h1>Actualización de Perfil</h1>
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
          <p>&copy; ${new Date().getFullYear()} App Navegación UTalca. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template HTML para cambio de contraseña por admin
export const crearEmailCambioPasswordAdmin = (nombre, password, loginUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #E53935 0%, #C62828 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333333; font-size: 24px; margin-bottom: 20px; }
        .content p { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .credentials { background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #E53935; margin: 20px 0; }
        .credentials p { margin: 5px 0; font-family: monospace; font-size: 16px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #E53935; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 14px; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Contraseña Actualizada</h1>
        </div>
        <div class="content">
          <h2>Hola, ${nombre}</h2>
          <p>Un administrador ha restablecido tu contraseña.</p>
          <p>Tu nueva contraseña es:</p>
          <div class="credentials">
            <p><strong>${password}</strong></p>
          </div>
          <p>Te recomendamos cambiarla después de iniciar sesión.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Iniciar Sesión</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} App Navegación UTalca. Todos los derechos reservados.</p>
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
