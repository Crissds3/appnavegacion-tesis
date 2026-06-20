import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import TourVirtual from '../models/TourVirtual.js';

const configurarCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// El public_id se basa en un id único (no en el nombre del archivo subido):
// usar el nombre original podía hacer que dos edificios con archivos .glb
// homónimos (ej. exportados con el mismo nombre genérico) se sobrescribieran
// entre sí en Cloudinary, dejando el modeloUrl de uno apuntando a un 404.
const subirArchivoACloudinary = (buffer, id) => {
  configurarCloudinary();
  return new Promise((resolve, reject) => {
    const publicId = `tour-virtual/${id}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',   // archivos binarios (no imagen/video)
        public_id: publicId,
        overwrite: true,
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Elimina un archivo de Cloudinary usando su public_id.
 */
const eliminarDeCloudinary = async (publicId) => {
  if (!publicId) return;
  configurarCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    console.warn('No se pudo eliminar el archivo de Cloudinary:', error.message);
  }
};

// ─────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────

export const obtenerEdificiosPublicos = async (req, res) => {
  try {
    const edificios = await TourVirtual.find({ activo: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: edificios });
  } catch (error) {
    console.error('Error en obtenerEdificiosPublicos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener edificios', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const crearEdificio = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).json({ success: false, message: 'Nombre y descripcion son obligatorios' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Debe subir un archivo .glb' });
    }

    // Subir a Cloudinary usando un id único propio (no el del documento, que aún no existe)
    const nuevoId = new mongoose.Types.ObjectId();
    const { url, publicId } = await subirArchivoACloudinary(req.file.buffer, nuevoId.toString());

    const edificio = await TourVirtual.create({
      _id: nuevoId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      modeloUrl: url,
      cloudinaryPublicId: publicId,
      creadoPor: req.usuario.id,
    });

    res.status(201).json({ success: true, message: 'Edificio creado exitosamente', data: edificio });
  } catch (error) {
    console.error('Error en crearEdificio:', error);
    res.status(500).json({ success: false, message: 'Error al crear edificio', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const obtenerEdificiosAdmin = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.activo !== undefined) {
      filtro.activo = req.query.activo === 'true';
    }
    const edificios = await TourVirtual.find(filtro).sort({ createdAt: -1 });
    res.json({ success: true, data: edificios });
  } catch (error) {
    console.error('Error en obtenerEdificiosAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener edificios', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const actualizarEdificio = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    const edificio = await TourVirtual.findById(req.params.id);

    if (!edificio) {
      return res.status(404).json({ success: false, message: 'Edificio no encontrado' });
    }

    if (nombre !== undefined) edificio.nombre = nombre.trim();
    if (descripcion !== undefined) edificio.descripcion = descripcion.trim();
    if (activo !== undefined) edificio.activo = activo === 'true' || activo === true;

    // Si se sube un nuevo GLB, reemplazar el anterior en Cloudinary
    if (req.file) {
      await eliminarDeCloudinary(edificio.cloudinaryPublicId);
      const { url, publicId } = await subirArchivoACloudinary(req.file.buffer, edificio._id.toString());
      edificio.modeloUrl = url;
      edificio.cloudinaryPublicId = publicId;
    }

    await edificio.save();
    res.json({ success: true, message: 'Edificio actualizado exitosamente', data: edificio });
  } catch (error) {
    console.error('Error en actualizarEdificio:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar edificio', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const eliminarEdificio = async (req, res) => {
  try {
    const edificio = await TourVirtual.findById(req.params.id);

    if (!edificio) {
      return res.status(404).json({ success: false, message: 'Edificio no encontrado' });
    }

    // Eliminar el archivo de Cloudinary
    await eliminarDeCloudinary(edificio.cloudinaryPublicId);
    await TourVirtual.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Edificio eliminado exitosamente' });
  } catch (error) {
    console.error('Error en eliminarEdificio:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar edificio', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
