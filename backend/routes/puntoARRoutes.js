import express from 'express';
import { obtenerPuntosPublicos, obtenerTodosPuntos, crearPunto, actualizarPunto, eliminarPunto } from '../controllers/puntoARController.js';
import { proteger, autorizarRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/publicos', obtenerPuntosPublicos);
router.get('/', proteger, autorizarRoles('admin', 'superadmin'), obtenerTodosPuntos);
router.post('/', proteger, autorizarRoles('admin', 'superadmin'), crearPunto);
router.put('/:id', proteger, autorizarRoles('admin', 'superadmin'), actualizarPunto);
router.delete('/:id', proteger, autorizarRoles('admin', 'superadmin'), eliminarPunto);

export default router;
