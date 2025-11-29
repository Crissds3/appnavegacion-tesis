import express from 'express';
import * as ubicacionController from '../controllers/ubicacionController.js';
import { proteger, autorizarRoles } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (para estudiantes y visitantes)
router.get('/publicas', ubicacionController.obtenerUbicaciones);
router.get('/cercanas', ubicacionController.buscarUbicacionesCercanas);

// Rutas protegidas (solo administradores)
router.get('/', proteger, autorizarRoles('admin', 'superadmin'), ubicacionController.obtenerUbicaciones);
router.get('/:id', proteger, autorizarRoles('admin', 'superadmin'), ubicacionController.obtenerUbicacionPorId);
router.post('/', proteger, autorizarRoles('admin', 'superadmin'), ubicacionController.crearUbicacion);
router.put('/:id', proteger, autorizarRoles('admin', 'superadmin'), ubicacionController.actualizarUbicacion);
router.delete('/:id', proteger, autorizarRoles('admin', 'superadmin'), ubicacionController.eliminarUbicacion);

export default router;
