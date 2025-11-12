import mongoose from 'mongoose';

const carreraSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la carrera es obligatorio'],
    trim: true,
    unique: true
  },
  codigo: {
    type: String,
    required: [true, 'El código es obligatorio'],
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
  facultad: {
    type: String,
    required: [true, 'La facultad es obligatoria'],
    trim: true
  },
  grado: {
    type: String,
    required: [true, 'El grado académico es obligatorio'],
    trim: true
  },
  requisitos: {
    type: String,
    default: ''
  },
  perfilEgreso: {
    type: String,
    default: ''
  },
  campoLaboral: {
    type: String,
    default: ''
  },
  mallaCurricular: {
    type: String,
    default: ''
  },
  contacto: {
    email: {
      type: String,
      default: ''
    },
    telefono: {
      type: String,
      default: ''
    },
    oficina: {
      type: String,
      default: ''
    }
  },
  imagenUrl: {
    type: String,
    default: ''
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
