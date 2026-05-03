import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { proteger, autorizarRoles } from '../middleware/auth.js';
import {
  crearEdificio,
  obtenerEdificiosPublicos,
  obtenerEdificiosAdmin,
  actualizarEdificio,
  eliminarEdificio,
} from '../controllers/tourVirtualController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'tour-virtual');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isGlb = ext === '.glb' || file.mimetype === 'model/gltf-binary';
  if (!isGlb) {
    return cb(new Error('Solo se permiten archivos .glb'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
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
