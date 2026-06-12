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
    },
    // Sin estos límites, una conexión SMTP atascada puede tardar varios
    // minutos en fallar (los defaults de nodemailer llegan hasta 10 min),
    // dejando colgada cualquier petición que espere el envío del correo.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
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

// ─── Plantilla base compartida por todos los correos ────────────────────────
const ESTILOS = `
  body {
    margin: 0;
    padding: 0;
    background-color: #f1f2f4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .wrapper {
    max-width: 560px;
    margin: 0 auto;
    padding: 40px 16px;
  }
  .card {
    background-color: #ffffff;
    border-radius: 12px;
    border: 1px solid #e6e7eb;
    overflow: hidden;
  }
  .accent {
    height: 4px;
    background-color: #C62828;
  }
  .brand {
    padding: 28px 32px 0 32px;
  }
  .brand-eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #C62828;
  }
  .brand-sub {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #80868b;
  }
  .content {
    padding: 18px 32px 32px 32px;
  }
  .content h1 {
    font-size: 21px;
    font-weight: 700;
    color: #202124;
    margin: 12px 0 18px 0;
  }
  .content p {
    font-size: 15px;
    line-height: 1.65;
    color: #4d5156;
    margin: 0 0 16px 0;
  }
  .content ul {
    margin: 0 0 16px 0;
    padding: 16px 20px 16px 36px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  .content li {
    font-size: 14px;
    color: #4d5156;
    line-height: 1.9;
  }
  .btn-wrap {
    text-align: center;
    margin: 28px 0;
  }
  .btn {
    display: inline-block;
    padding: 13px 32px;
    background-color: #C62828;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 15px;
  }
  .fallback {
    font-size: 12px;
    color: #9aa0a6;
    line-height: 1.6;
    word-break: break-all;
    margin: 0;
  }
  .note {
    margin-top: 24px;
    padding: 12px 16px;
    border-left: 3px solid #C62828;
    background-color: #fdf2f2;
    border-radius: 0 8px 8px 0;
    font-size: 13px;
    color: #8a3434;
  }
  .footer {
    padding: 24px 12px 0 12px;
    text-align: center;
  }
  .footer p {
    margin: 0 0 4px 0;
    font-size: 12px;
    color: #9aa0a6;
    line-height: 1.6;
  }
`;

const crearLayoutEmail = (titulo, contenidoHtml) => `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <style>${ESTILOS}</style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="accent"></div>
        <div class="brand">
          <p class="brand-eyebrow">Portal de Navegación</p>
          <p class="brand-sub">Universidad de Talca · Campus Curicó</p>
        </div>
        <div class="content">
          ${contenidoHtml}
        </div>
      </div>
      <div class="footer">
        <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
        <p>&copy; ${new Date().getFullYear()} Portal de Navegación · Universidad de Talca, Campus Curicó</p>
      </div>
    </div>
  </body>
  </html>
`;

// Template para el correo de recuperación de contraseña
export const crearEmailRecuperacion = (nombre, resetUrl) => crearLayoutEmail('Recuperación de contraseña', `
  <h1>Restablece tu contraseña</h1>
  <p>Hola ${nombre}, recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este correo con tranquilidad.</p>
  <div class="btn-wrap">
    <a href="${resetUrl}" class="btn">Restablecer contraseña</a>
  </div>
  <p class="fallback">¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>${resetUrl}</p>
  <div class="note"><strong>Este enlace expira en 1 hora</strong> y solo puede usarse una vez.</div>
`);

export const enviarEmail = async (opciones) => {
  return enviarEmailRecuperacion(opciones);
};

// Template para bienvenida de nuevo administrador (envía link de configuración, no contraseña)
export const crearEmailBienvenida = (nombre, setupUrl) => crearLayoutEmail('Bienvenido al Portal de Navegación', `
  <h1>Bienvenido/a, ${nombre}</h1>
  <p>Se creó una cuenta de administrador para ti en el Portal de Navegación del Campus Curicó. Antes de ingresar, configura tu contraseña.</p>
  <div class="btn-wrap">
    <a href="${setupUrl}" class="btn">Configurar mi contraseña</a>
  </div>
  <p class="fallback">¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>${setupUrl}</p>
  <div class="note"><strong>Este enlace expira en 48 horas</strong> y solo puede usarse una vez.</div>
`);

// Template para notificación de actualización de perfil
export const crearEmailActualizacionPerfil = (nombre, cambios) => {
  const listaCambios = Object.entries(cambios)
    .map(([campo, valor]) => `<li><strong>${campo}:</strong> ${valor}</li>`)
    .join('');

  return crearLayoutEmail('Actualización de perfil', `
    <h1>Tu perfil fue actualizado</h1>
    <p>Hola ${nombre}, un administrador modificó los siguientes datos de tu cuenta:</p>
    <ul>${listaCambios}</ul>
    <div class="note">Si no reconoces estos cambios, contacta al administrador principal lo antes posible.</div>
  `);
};

// Template para notificación de cambio de contraseña por un administrador (sin incluirla)
export const crearEmailCambioPasswordAdmin = (nombre, recuperacionUrl) => crearLayoutEmail('Contraseña actualizada', `
  <h1>Tu contraseña fue restablecida</h1>
  <p>Hola ${nombre}, un administrador restableció la contraseña de tu cuenta.</p>
  <p>Si necesitas recuperar el acceso, solicita un enlace de recuperación:</p>
  <div class="btn-wrap">
    <a href="${recuperacionUrl}" class="btn">Recuperar contraseña</a>
  </div>
  <div class="note">Si no reconoces esta acción, contacta al administrador principal de inmediato.</div>
`);

export default {
  enviarEmailRecuperacion,
  crearEmailRecuperacion,
  enviarEmail,
  crearEmailBienvenida,
  crearEmailActualizacionPerfil,
  crearEmailCambioPasswordAdmin
};
