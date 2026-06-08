import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  crearAdministrador,
  obtenerAdministradores,
  eliminarAdministrador,
  solicitarRecuperacion,
  restablecerPassword,
  editarUsuario,
  toggleEstadoUsuario,
  resetearPasswordPorAdmin
} from '../controllers/authController.js';
import { proteger, soloSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const limitadorRecuperacion = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Demasiadas solicitudes de recuperación. Intenta de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rutas públicas
router.post('/login', limitadorLogin, loginUsuario);
router.post('/solicitar-recuperacion', limitadorRecuperacion, solicitarRecuperacion);
router.post('/restablecer-password', restablecerPassword);

// Rutas protegidas (requieren autenticación)
router.get('/me', proteger, obtenerPerfil);
router.put('/me', proteger, actualizarPerfil);

// Rutas solo para superadmin (administrador principal)
router.post('/crear-admin', proteger, soloSuperAdmin, crearAdministrador);
router.get('/administradores', proteger, soloSuperAdmin, obtenerAdministradores);
router.put('/usuarios/:id', proteger, soloSuperAdmin, editarUsuario);
router.patch('/usuarios/:id/toggle-estado', proteger, soloSuperAdmin, toggleEstadoUsuario);
router.patch('/usuarios/:id/resetear-password', proteger, soloSuperAdmin, resetearPasswordPorAdmin);
router.delete('/administradores/:id', proteger, soloSuperAdmin, eliminarAdministrador);

export default router;
