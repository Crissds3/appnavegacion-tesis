import express from 'express';
import multer from 'multer';
import {
  obtenerNoticiasPublicas,
  obtenerTodasNoticias,
  obtenerNoticiaPorId,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
  limpiarTodasNoticias,
} from '../controllers/noticiaController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Rutas públicas
router.get('/publicas', obtenerNoticiasPublicas);
router.get('/:id', obtenerNoticiaPorId);

// Rutas protegidas (admin)
router.get('/', proteger, obtenerTodasNoticias);
router.post('/', proteger, upload.single('imagen'), crearNoticia);
router.put('/:id', proteger, upload.single('imagen'), actualizarNoticia);
router.delete('/limpiar-todas', proteger, limpiarTodasNoticias);
router.delete('/:id', proteger, eliminarNoticia);

export default router;
