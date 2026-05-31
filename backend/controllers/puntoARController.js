import PuntoAR from '../models/PuntoAR.js';

export const obtenerPuntosPublicos = async (req, res) => {
  try {
    const puntos = await PuntoAR.find({ activo: true }).sort({ nombre: 1 });
    res.json({ success: true, data: puntos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener puntos AR', error: err.message });
  }
};

export const obtenerTodosPuntos = async (req, res) => {
  try {
    const puntos = await PuntoAR.find().sort({ createdAt: -1 });
    res.json({ success: true, data: puntos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener puntos AR', error: err.message });
  }
};

export const crearPunto = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, message: 'Sin permisos' });
    }
    const punto = await PuntoAR.create(req.body);
    res.status(201).json({ success: true, message: 'Punto AR creado', data: punto });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al crear punto AR', error: err.message });
  }
};

export const actualizarPunto = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, message: 'Sin permisos' });
    }
    const punto = await PuntoAR.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!punto) return res.status(404).json({ success: false, message: 'Punto AR no encontrado' });
    res.json({ success: true, message: 'Punto AR actualizado', data: punto });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al actualizar punto AR', error: err.message });
  }
};

export const eliminarPunto = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, message: 'Sin permisos' });
    }
    const punto = await PuntoAR.findByIdAndDelete(req.params.id);
    if (!punto) return res.status(404).json({ success: false, message: 'Punto AR no encontrado' });
    res.json({ success: true, message: 'Punto AR eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al eliminar punto AR', error: err.message });
  }
};
