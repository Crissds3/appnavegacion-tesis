import express from 'express';
import {
  obtenerCarrerasPublicas,
  obtenerCarreraPorId,
  obtenerTodasCarreras,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera
} from '../controllers/carreraController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/publicas', obtenerCarrerasPublicas);
router.get('/publica/:id', obtenerCarreraPorId);

// Rutas protegidas (admin)
router.get('/', proteger, obtenerTodasCarreras);
router.post('/', proteger, crearCarrera);
router.put('/:id', proteger, actualizarCarrera);
router.delete('/:id', proteger, eliminarCarrera);

export default router;
