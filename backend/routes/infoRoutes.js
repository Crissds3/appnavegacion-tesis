import express from 'express';
import {
  obtenerInfoPublica,
  obtenerInfoPorSeccion,
  actualizarInfo,
  obtenerTodasSecciones
} from '../controllers/infoController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/publica', obtenerInfoPublica);
router.get('/publica/:seccion', obtenerInfoPorSeccion);

// Rutas protegidas (admin)
router.get('/', proteger, obtenerTodasSecciones);
router.post('/', proteger, actualizarInfo);
router.put('/', proteger, actualizarInfo);

export default router;
