import express from 'express';
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

// Rutas públicas
router.post('/login', loginUsuario);
router.post('/solicitar-recuperacion', solicitarRecuperacion);
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
