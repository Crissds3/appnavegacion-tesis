import express from 'express';
import {
  obtenerNoticiasPublicas,
  obtenerTodasNoticias,
  obtenerNoticiaPorId,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia
} from '../controllers/noticiaController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/publicas', obtenerNoticiasPublicas);
router.get('/:id', obtenerNoticiaPorId);

// Rutas protegidas (admin)
router.get('/', proteger, obtenerTodasNoticias);
router.post('/', proteger, crearNoticia);
router.put('/:id', proteger, actualizarNoticia);
router.delete('/:id', proteger, eliminarNoticia);

export default router;
