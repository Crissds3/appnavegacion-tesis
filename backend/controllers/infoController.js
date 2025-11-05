import InfoUniversidad from '../models/InfoUniversidad.js';

// Obtener toda la información (público)
export const obtenerInfoPublica = async (req, res) => {
  try {
    const info = await InfoUniversidad.find({ activo: true })
      .sort({ orden: 1 });

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error en obtenerInfoPublica:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información',
      error: error.message
    });
  }
};

// Obtener información por sección (público)
export const obtenerInfoPorSeccion = async (req, res) => {
  try {
    const info = await InfoUniversidad.findOne({ 
      seccion: req.params.seccion,
      activo: true 
    });

    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'Sección no encontrada'
      });
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error en obtenerInfoPorSeccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información',
      error: error.message
    });
  }
};

// Actualizar información (admin)
export const actualizarInfo = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar la información'
      });
    }

    const { seccion, titulo, contenido, icono, orden, activo } = req.body;

    let info = await InfoUniversidad.findOne({ seccion });

    if (!info) {
      // Crear nueva sección
      info = await InfoUniversidad.create({
        seccion,
        titulo,
        contenido,
        icono,
        orden,
        activo,
        updatedBy: req.usuario.id
      });

      return res.status(201).json({
        success: true,
        message: 'Información creada exitosamente',
        data: info
      });
    }

    // Actualizar sección existente
    info.titulo = titulo || info.titulo;
    info.contenido = contenido || info.contenido;
    info.icono = icono || info.icono;
    info.orden = orden !== undefined ? orden : info.orden;
    info.activo = activo !== undefined ? activo : info.activo;
    info.updatedBy = req.usuario.id;

    await info.save();

    res.json({
      success: true,
      message: 'Información actualizada exitosamente',
      data: info
    });
  } catch (error) {
    console.error('Error en actualizarInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la información',
      error: error.message
    });
  }
};

// Obtener todas las secciones (admin)
export const obtenerTodasSecciones = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }

    const info = await InfoUniversidad.find()
      .populate('updatedBy', 'nombre email')
      .sort({ orden: 1 });

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error en obtenerTodasSecciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las secciones',
      error: error.message
    });
  }
};
