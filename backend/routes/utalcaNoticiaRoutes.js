import express from 'express';
import { obtenerNoticiasUtalca } from '../controllers/utalcaNoticiaController.js';

const router = express.Router();

router.get('/', obtenerNoticiasUtalca);

export default router;
