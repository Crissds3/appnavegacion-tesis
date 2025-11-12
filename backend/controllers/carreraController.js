import Carrera from '../models/Carrera.js';

// Obtener todas las carreras públicas (activas)
export const obtenerCarrerasPublicas = async (req, res) => {
  try {
    const carreras = await Carrera.find({ activo: true })
      .sort({ orden: 1, nombre: 1 });

    res.json({
      success: true,
      data: carreras
    });
  } catch (error) {
    console.error('Error en obtenerCarrerasPublicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las carreras',
      error: error.message
    });
  }
};

// Obtener una carrera por ID (público)
export const obtenerCarreraPorId = async (req, res) => {
  try {
    const carrera = await Carrera.findById(req.params.id);

    if (!carrera) {
      return res.status(404).json({
        success: false,
        message: 'Carrera no encontrada'
      });
    }

    res.json({
      success: true,
      data: carrera
    });
  } catch (error) {
    console.error('Error en obtenerCarreraPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la carrera',
      error: error.message
    });
  }
};

// Obtener todas las carreras (admin)
export const obtenerTodasCarreras = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }

    const carreras = await Carrera.find()
      .populate('createdBy', 'nombre email')
      .populate('updatedBy', 'nombre email')
      .sort({ orden: 1, nombre: 1 });

    res.json({
      success: true,
      data: carreras
    });
  } catch (error) {
    console.error('Error en obtenerTodasCarreras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las carreras',
      error: error.message
    });
  }
};

// Crear carrera (admin)
export const crearCarrera = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear carreras'
      });
    }

    const carreraData = {
      ...req.body,
      createdBy: req.usuario.id,
      updatedBy: req.usuario.id
    };

    const carrera = await Carrera.create(carreraData);

    res.status(201).json({
      success: true,
      message: 'Carrera creada exitosamente',
      data: carrera
    });
  } catch (error) {
    console.error('Error en crearCarrera:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una carrera con ese nombre o código'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear la carrera',
      error: error.message
    });
  }
};

// Actualizar carrera (admin)
export const actualizarCarrera = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden actualizar carreras'
      });
    }

    const carrera = await Carrera.findById(req.params.id);

    if (!carrera) {
      return res.status(404).json({
        success: false,
        message: 'Carrera no encontrada'
      });
    }

    Object.assign(carrera, req.body);
    carrera.updatedBy = req.usuario.id;

    await carrera.save();

    res.json({
      success: true,
      message: 'Carrera actualizada exitosamente',
      data: carrera
    });
  } catch (error) {
    console.error('Error en actualizarCarrera:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una carrera con ese nombre o código'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar la carrera',
      error: error.message
    });
  }
};

// Eliminar carrera (admin)
export const eliminarCarrera = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar carreras'
      });
    }

    const carrera = await Carrera.findById(req.params.id);

    if (!carrera) {
      return res.status(404).json({
        success: false,
        message: 'Carrera no encontrada'
      });
    }

    await carrera.deleteOne();

    res.json({
      success: true,
      message: 'Carrera eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en eliminarCarrera:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la carrera',
      error: error.message
    });
  }
};
