// Script de prueba para verificar el envío de correos
// Ejecutar con: node scripts/testEmail.js

import dotenv from 'dotenv';
import { enviarEmailRecuperacion, crearEmailRecuperacion } from '../config/email.js';

dotenv.config();

const testEmail = async () => {
  console.log('🧪 Iniciando prueba de envío de correo...\n');

  // Verificar variables de entorno
  console.log('📋 Configuración detectada:');
  console.log('- SendGrid API Key:', process.env.SENDGRID_API_KEY ? '✓ Configurado' : '✗ No configurado');
  console.log('- Email Host:', process.env.EMAIL_HOST || 'No configurado');
  console.log('- Email User:', process.env.EMAIL_USER || 'No configurado');
  console.log('- Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
  console.log('');

  // Email de prueba (CAMBIAR POR TU EMAIL)
  const emailPrueba = process.env.TEST_EMAIL || 'tu-email@ejemplo.com';
  const nombrePrueba = 'Usuario de Prueba';
  const tokenPrueba = 'abc123test456';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer-password/${tokenPrueba}`;

  console.log(`📧 Intentando enviar correo a: ${emailPrueba}\n`);

  try {
    const resultado = await enviarEmailRecuperacion({
      email: emailPrueba,
      subject: '🧪 Prueba de Recuperación de Contraseña',
      html: crearEmailRecuperacion(nombrePrueba, resetUrl)
    });

    console.log('✅ ¡Correo enviado exitosamente!');
    console.log('Message ID:', resultado.messageId);
    console.log('\n📬 Revisa tu bandeja de entrada (y spam) para verificar el correo\n');
  } catch (error) {
    console.error('❌ Error al enviar correo:');
    console.error(error.message);
    console.error('\n💡 Sugerencias:');
    console.error('1. Verifica que las variables de entorno estén configuradas correctamente');
    console.error('2. Si usas Gmail, asegúrate de usar una "Contraseña de aplicación"');
    console.error('3. Si usas SendGrid, verifica que la API Key sea válida');
    console.error('4. Revisa el archivo .env.example para la configuración correcta\n');
  }
};

// Ejecutar prueba
testEmail();
