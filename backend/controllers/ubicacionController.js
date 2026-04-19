import Ubicacion from '../models/Ubicacion.js';

export const obtenerUbicaciones = async (req, res) => {
  try {
    const { tipo, visible } = req.query;
    
    const filtro = {};
    if (tipo) filtro.tipo = tipo;
    if (visible !== undefined) filtro.visible = visible === 'true';
    
    const ubicaciones = await Ubicacion.find(filtro)
      .sort({ nombre: 1 });
    
    res.json({
      success: true,
      count: ubicaciones.length,
      data: ubicaciones
    });
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ubicaciones',
      error: error.message
    });
  }
};

// Obtener ubicación por ID
export const obtenerUbicacionPorId = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findById(req.params.id);
    
    if (!ubicacion) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: ubicacion
    });
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ubicación',
      error: error.message
    });
  }
};

// Crear nueva ubicación
export const crearUbicacion = async (req, res) => {
  try {
    const { nombre, tipo, categoria, descripcion, latitud, longitud, icono, metadatos } = req.body;
    
    if (!nombre || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tipo son obligatorios'
      });
    }
    
    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son obligatorias'
      });
    }
    
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Las coordenadas deben ser números válidos'
      });
    }
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'La latitud debe estar entre -90 y 90'
      });
    }
    
    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'La longitud debe estar entre -180 y 180'
      });
    }
    
    // Crear ubicación con formato GeoJSON
    // GeoJSON requiere [longitud, latitud] pero recibimos latitud y longitud del frontend
    const nuevaUbicacion = new Ubicacion({
      nombre,
      tipo,
      categoria,
      descripcion,
      ubicacion: {
        type: 'Point',
        coordinates: [lng, lat] // [longitud, latitud] - formato GeoJSON
      },
      icono,
      metadatos
    });
    
    await nuevaUbicacion.save();
    
    res.status(201).json({
      success: true,
      message: 'Ubicación creada exitosamente',
      data: nuevaUbicacion
    });
  } catch (error) {
    console.error('Error al crear ubicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear ubicación',
      error: error.message
    });
  }
};

// Actualizar ubicación
export const actualizarUbicacion = async (req, res) => {
  try {
    const { nombre, tipo, categoria, descripcion, latitud, longitud, icono, visible, metadatos } = req.body;
    
    const ubicacion = await Ubicacion.findById(req.params.id);
    
    if (!ubicacion) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }
    
    if (nombre !== undefined) ubicacion.nombre = nombre;
    if (tipo !== undefined) ubicacion.tipo = tipo;
    if (categoria !== undefined) ubicacion.categoria = categoria;
    if (descripcion !== undefined) ubicacion.descripcion = descripcion;
    if (icono !== undefined) ubicacion.icono = icono;
    if (visible !== undefined) ubicacion.visible = visible;
    if (metadatos !== undefined) ubicacion.metadatos = metadatos;
    
    // Actualizar coordenadas si se proporcionan
    if (latitud !== undefined && longitud !== undefined) {
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Las coordenadas deben ser números válidos'
        });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas fuera de rango válido'
        });
      }
      
      ubicacion.ubicacion = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }
    
    await ubicacion.save();
    
    res.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: ubicacion
    });
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ubicación',
      error: error.message
    });
  }
};

// Eliminar ubicación
export const eliminarUbicacion = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findByIdAndDelete(req.params.id);
    
    if (!ubicacion) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Ubicación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ubicación',
      error: error.message
    });
  }
};

// Buscar ubicaciones cercanas
export const buscarUbicacionesCercanas = async (req, res) => {
  try {
    const { latitud, longitud, distanciaMaxima = 1000 } = req.query;
    
    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren latitud y longitud'
      });
    }
    
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    
    // Consulta geoespacial usando $near
    const ubicaciones = await Ubicacion.find({
      ubicacion: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(distanciaMaxima) // en metros
        }
      },
      visible: true
    }).limit(20);
    
    res.json({
      success: true,
      count: ubicaciones.length,
      data: ubicaciones
    });
  } catch (error) {
    console.error('Error al buscar ubicaciones cercanas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar ubicaciones cercanas',
      error: error.message
    });
  }
};
