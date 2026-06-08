import { v2 as cloudinary } from 'cloudinary';
import xss from 'xss';
import Noticia from '../models/Noticia.js';
import Ubicacion from '../models/Ubicacion.js';

const configurarCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const subirImagenACloudinary = (buffer, filename) => {
  configurarCloudinary();
  return new Promise((resolve, reject) => {
    const publicId = `noticias/${filename
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: true,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

const eliminarImagenDeCloudinary = async (publicId) => {
  if (!publicId) return;
  configurarCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('No se pudo eliminar imagen de Cloudinary:', err.message);
  }
};

// ── Obtener noticias públicas ────────────────────────────────
export const obtenerNoticiasPublicas = async (req, res) => {
  try {
    const { tipo, categoria, destacado } = req.query;
    const filtros = { activo: true };
    if (tipo) filtros.tipo = tipo;
    if (categoria) filtros.categoria = categoria;
    if (destacado) filtros.destacado = destacado === 'true';

    const noticias = await Noticia.find(filtros)
      .populate('autor', 'nombre')
      .populate('ubicacionWayfinding', 'nombre')
      .sort({ destacado: -1, createdAt: -1 })
      .limit(50)
      .select('-__v');

    res.json({ success: true, data: noticias });
  } catch (error) {
    console.error('Error en obtenerNoticiasPublicas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las noticias', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Obtener todas (admin) ────────────────────────────────────
export const obtenerTodasNoticias = async (req, res) => {
  try {
    const noticias = await Noticia.find()
      .populate('autor', 'nombre email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: noticias });
  } catch (error) {
    console.error('Error en obtenerTodasNoticias:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las noticias', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Obtener por ID ───────────────────────────────────────────
export const obtenerNoticiaPorId = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id)
      .populate('autor', 'nombre email')
      .populate('ubicacionWayfinding', 'nombre');

    if (!noticia) {
      return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
    }
    res.json({ success: true, data: noticia });
  } catch (error) {
    console.error('Error en obtenerNoticiaPorId:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la noticia', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Crear noticia ────────────────────────────────────────────
export const crearNoticia = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden crear noticias' });
    }

    const { titulo, descripcion, contenido, tipo, categoria, fechaEvento, ubicacionEvento, ubicacionWayfinding, destacado } = req.body;

    let imagenUrl = '';
    let cloudinaryPublicId = '';

    if (req.file) {
      const { url, publicId } = await subirImagenACloudinary(req.file.buffer, req.file.originalname);
      imagenUrl = url;
      cloudinaryPublicId = publicId;
    }

    const noticia = await Noticia.create({
      titulo: xss(titulo || ''),
      descripcion: xss(descripcion || ''),
      contenido: xss(contenido || ''),
      tipo,
      categoria,
      imagenUrl,
      cloudinaryPublicId,
      fechaEvento: fechaEvento || undefined,
      ubicacionEvento: ubicacionEvento || '',
      ubicacionWayfinding: ubicacionWayfinding || null,
      destacado: destacado === 'true' || destacado === true || false,
      autor: req.usuario.id,
    });

    res.status(201).json({ success: true, message: 'Noticia creada exitosamente', data: noticia });
  } catch (error) {
    console.error('Error en crearNoticia:', error);
    res.status(500).json({ success: false, message: 'Error al crear la noticia', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Actualizar noticia ───────────────────────────────────────
export const actualizarNoticia = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden actualizar noticias' });
    }

    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) {
      return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
    }

    const campos = { ...req.body };
    if (campos.titulo) campos.titulo = xss(campos.titulo);
    if (campos.descripcion) campos.descripcion = xss(campos.descripcion);
    if (campos.contenido) campos.contenido = xss(campos.contenido);
    if (campos.ubicacionEvento) campos.ubicacionEvento = xss(campos.ubicacionEvento);
    if (campos.ubicacionWayfinding === '' || campos.ubicacionWayfinding === 'null') {
      campos.ubicacionWayfinding = null;
    }
    if (typeof campos.destacado === 'string') campos.destacado = campos.destacado === 'true';
    if (typeof campos.activo === 'string') campos.activo = campos.activo === 'true';

    // Si llega nueva imagen, reemplazar la anterior en Cloudinary
    if (req.file) {
      await eliminarImagenDeCloudinary(noticia.cloudinaryPublicId);
      const { url, publicId } = await subirImagenACloudinary(req.file.buffer, req.file.originalname);
      campos.imagenUrl = url;
      campos.cloudinaryPublicId = publicId;
    }

    // Si se pidió borrar la imagen explícitamente
    if (campos.eliminarImagen === 'true') {
      await eliminarImagenDeCloudinary(noticia.cloudinaryPublicId);
      campos.imagenUrl = '';
      campos.cloudinaryPublicId = '';
      delete campos.eliminarImagen;
    }

    const noticiaActualizada = await Noticia.findByIdAndUpdate(
      req.params.id,
      { ...campos, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Noticia actualizada exitosamente', data: noticiaActualizada });
  } catch (error) {
    console.error('Error en actualizarNoticia:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la noticia', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Eliminar noticia ─────────────────────────────────────────
export const eliminarNoticia = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden eliminar noticias' });
    }

    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) {
      return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
    }

    await eliminarImagenDeCloudinary(noticia.cloudinaryPublicId);

    const ubicacionId = noticia.ubicacionWayfinding;
    await Noticia.findByIdAndDelete(req.params.id);

    if (ubicacionId) {
      const ubicacion = await Ubicacion.findById(ubicacionId);
      if (ubicacion && ubicacion.tipo === 'evento') {
        await Ubicacion.findByIdAndDelete(ubicacionId);
      }
    }

    res.json({ success: true, message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    console.error('Error en eliminarNoticia:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la noticia', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Limpiar todas las noticias (superadmin) ──────────────────
export const limpiarTodasNoticias = async (req, res) => {
  try {
    if (req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Solo el superadmin puede realizar esta acción' });
    }

    const noticias = await Noticia.find({ cloudinaryPublicId: { $ne: '' } });
    await Promise.allSettled(noticias.map(n => eliminarImagenDeCloudinary(n.cloudinaryPublicId)));

    const result = await Noticia.deleteMany({});
    res.json({ success: true, message: `${result.deletedCount} noticias eliminadas correctamente` });
  } catch (error) {
    console.error('Error en limpiarTodasNoticias:', error);
    res.status(500).json({ success: false, message: 'Error al limpiar noticias', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
