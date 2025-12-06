import Noticia from '../models/Noticia.js';

// Obtener todas las noticias activas (público)
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
      .limit(50);

    res.json({
      success: true,
      data: noticias
    });
  } catch (error) {
    console.error('Error en obtenerNoticiasPublicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las noticias',
      error: error.message
    });
  }
};

// Obtener todas las noticias (admin)
export const obtenerTodasNoticias = async (req, res) => {
  try {
    const noticias = await Noticia.find()
      .populate('autor', 'nombre email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: noticias
    });
  } catch (error) {
    console.error('Error en obtenerTodasNoticias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las noticias',
      error: error.message
    });
  }
};

// Obtener una noticia por ID
export const obtenerNoticiaPorId = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id)
      .populate('autor', 'nombre email')
      .populate('ubicacionWayfinding', 'nombre');

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    res.json({
      success: true,
      data: noticia
    });
  } catch (error) {
    console.error('Error en obtenerNoticiaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la noticia',
      error: error.message
    });
  }
};

// Crear noticia (admin)
export const crearNoticia = async (req, res) => {
  try {
    const { titulo, descripcion, contenido, tipo, categoria, imagenUrl, imagenBase64, fechaEvento, ubicacionEvento, ubicacionWayfinding, destacado } = req.body;

    // Validar que el usuario sea admin
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear noticias'
      });
    }

    const noticia = await Noticia.create({
      titulo,
      descripcion,
      contenido,
      tipo,
      categoria,
      imagenUrl,
      imagenBase64,
      fechaEvento,
      ubicacionEvento,
      ubicacionWayfinding: ubicacionWayfinding || null,
      destacado: destacado || false,
      autor: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Noticia creada exitosamente',
      data: noticia
    });
  } catch (error) {
    console.error('Error en crearNoticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la noticia',
      error: error.message
    });
  }
};

// Actualizar noticia (admin)
export const actualizarNoticia = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar noticias'
      });
    }

    if (req.body.ubicacionWayfinding === '') {
      req.body.ubicacionWayfinding = null;
    }

    const noticia = await Noticia.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Noticia actualizada exitosamente',
      data: noticia
    });
  } catch (error) {
    console.error('Error en actualizarNoticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la noticia',
      error: error.message
    });
  }
};

// Eliminar noticia (admin)
export const eliminarNoticia = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar noticias'
      });
    }

    const noticia = await Noticia.findByIdAndDelete(req.params.id);

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Noticia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en eliminarNoticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la noticia',
      error: error.message
    });
  }
};
