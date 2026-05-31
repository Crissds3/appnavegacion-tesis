import express from 'express';
import { obtenerPuntosPublicos, obtenerTodosPuntos, crearPunto, actualizarPunto, eliminarPunto } from '../controllers/puntoARController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

router.get('/publicos', obtenerPuntosPublicos);
router.get('/', proteger, obtenerTodosPuntos);
router.post('/', proteger, crearPunto);
router.put('/:id', proteger, actualizarPunto);
router.delete('/:id', proteger, eliminarPunto);

export default router;
