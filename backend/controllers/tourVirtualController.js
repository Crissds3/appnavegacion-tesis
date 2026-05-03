import path from 'path';
import fs from 'fs';
import TourVirtual from '../models/TourVirtual.js';

const uploadsRoot = path.join(process.cwd(), 'uploads', 'tour-virtual');

const getFilenameFromUrl = (modeloUrl) => {
  if (!modeloUrl) return '';
  try {
    const url = new URL(modeloUrl);
    return path.basename(url.pathname);
  } catch (error) {
    return path.basename(modeloUrl);
  }
};

const deleteModeloFile = async (modeloUrl) => {
  const filename = getFilenameFromUrl(modeloUrl);
  if (!filename) return;
  const filePath = path.join(uploadsRoot, filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.warn('No se pudo eliminar el archivo del modelo:', error.message);
  }
};

export const obtenerEdificiosPublicos = async (req, res) => {
  try {
    const edificios = await TourVirtual.find({ activo: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: edificios,
    });
  } catch (error) {
    console.error('Error en obtenerEdificiosPublicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener edificios',
      error: error.message,
    });
  }
};

export const crearEdificio = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y descripcion son obligatorios',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debe subir un archivo .glb',
      });
    }

    const modeloUrl = `${req.protocol}://${req.get('host')}/uploads/tour-virtual/${req.file.filename}`;

    const edificio = await TourVirtual.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      modeloUrl,
      creadoPor: req.usuario.id,
    });

    res.status(201).json({
      success: true,
      message: 'Edificio creado exitosamente',
      data: edificio,
    });
  } catch (error) {
    console.error('Error en crearEdificio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear edificio',
      error: error.message,
    });
  }
};

export const obtenerEdificiosAdmin = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.activo !== undefined) {
      filtro.activo = req.query.activo === 'true';
    }

    const edificios = await TourVirtual.find(filtro)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: edificios,
    });
  } catch (error) {
    console.error('Error en obtenerEdificiosAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener edificios',
      error: error.message,
    });
  }
};

export const actualizarEdificio = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    const edificio = await TourVirtual.findById(req.params.id);

    if (!edificio) {
      return res.status(404).json({
        success: false,
        message: 'Edificio no encontrado',
      });
    }

    if (nombre !== undefined) edificio.nombre = nombre.trim();
    if (descripcion !== undefined) edificio.descripcion = descripcion.trim();
    if (activo !== undefined) edificio.activo = activo === 'true' || activo === true;

    if (req.file) {
      const modeloUrl = `${req.protocol}://${req.get('host')}/uploads/tour-virtual/${req.file.filename}`;
      await deleteModeloFile(edificio.modeloUrl);
      edificio.modeloUrl = modeloUrl;
    }

    await edificio.save();

    res.json({
      success: true,
      message: 'Edificio actualizado exitosamente',
      data: edificio,
    });
  } catch (error) {
    console.error('Error en actualizarEdificio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar edificio',
      error: error.message,
    });
  }
};

export const eliminarEdificio = async (req, res) => {
  try {
    const edificio = await TourVirtual.findById(req.params.id);

    if (!edificio) {
      return res.status(404).json({
        success: false,
        message: 'Edificio no encontrado',
      });
    }

    await deleteModeloFile(edificio.modeloUrl);
    await TourVirtual.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Edificio eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en eliminarEdificio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar edificio',
      error: error.message,
    });
  }
};
