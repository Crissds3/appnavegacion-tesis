import mongoose from 'mongoose';

const horarioSchema = new mongoose.Schema({
  turno:    { type: String, required: true },  // "Lunes a Viernes"
  apertura: { type: String, required: true },  // "08:00"
  cierre:   { type: String, required: true },  // "20:00"
}, { _id: false });

const puntoARSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
  },
  descripcion: { type: String, trim: true, default: '' },
  categoria: {
    type: String,
    enum: ['biblioteca', 'casino', 'laboratorio', 'aula', 'administrativo', 'deportivo', 'otro'],
    default: 'otro',
  },
  latitud:  { type: Number, required: [true, 'La latitud es obligatoria'] },
  longitud: { type: Number, required: [true, 'La longitud es obligatoria'] },
  horarios: { type: [horarioSchema], default: [] },
  activo:   { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('PuntoAR', puntoARSchema);
