import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  crearAdministrador,
  obtenerAdministradores,
  eliminarAdministrador
} from '../controllers/authController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/login', loginUsuario);

// Rutas protegidas (requieren autenticación)
router.get('/me', proteger, obtenerPerfil);
router.put('/me', proteger, actualizarPerfil);
router.post('/crear-admin', proteger, crearAdministrador);
router.get('/administradores', proteger, obtenerAdministradores);
router.delete('/administradores/:id', proteger, eliminarAdministrador);

export default router;
