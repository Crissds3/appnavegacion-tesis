import express from 'express';
import multer from 'multer';
import { proteger, autorizarRoles } from '../middleware/auth.js';
import {
  crearEdificio,
  obtenerEdificiosPublicos,
  obtenerEdificiosAdmin,
  actualizarEdificio,
  eliminarEdificio,
} from '../controllers/tourVirtualController.js';

const router = express.Router();

// Usar memoryStorage: el archivo queda en req.file.buffer
// y se sube directo a Cloudinary sin tocar el disco local
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const isGlb = ext === 'glb' || file.mimetype === 'model/gltf-binary';
  if (!isGlb) {
    return cb(new Error('Solo se permiten archivos .glb'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

const uploadModelo = (req, res, next) => {
  upload.single('modelo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

router.get('/publicas', obtenerEdificiosPublicos);
router.get('/', proteger, autorizarRoles('admin', 'superadmin'), obtenerEdificiosAdmin);
router.post('/', proteger, autorizarRoles('admin', 'superadmin'), uploadModelo, crearEdificio);
router.put('/:id', proteger, autorizarRoles('admin', 'superadmin'), uploadModelo, actualizarEdificio);
router.delete('/:id', proteger, autorizarRoles('admin', 'superadmin'), eliminarEdificio);

export default router;
