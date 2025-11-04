import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  crearAdministrador
} from '../controllers/authController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/login', loginUsuario);

// Rutas protegidas (requieren autenticación)
router.get('/me', proteger, obtenerPerfil);
router.put('/me', proteger, actualizarPerfil);
router.post('/crear-admin', proteger, crearAdministrador);

export default router;
