import mongoose from 'mongoose';

const carreraSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la carrera es obligatorio'],
    trim: true,
    unique: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria']
  },
  duracion: {
    type: String,
    required: [true, 'La duración es obligatoria'],
    trim: true
  },
  modalidad: {
    type: String,
    enum: ['Presencial', 'Semi-presencial', 'Online'],
    default: 'Presencial'
  },
  enlaceOficial: {
    type: String,
    required: [true, 'El enlace a la página oficial es obligatorio'],
    trim: true
  },
  ubicacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ubicacion'
  },
  orden: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Carrera = mongoose.model('Carrera', carreraSchema);

export default Carrera;
