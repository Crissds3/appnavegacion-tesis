import mongoose from 'mongoose';

const infoUniversidadSchema = new mongoose.Schema({
  seccion: {
    type: String,
    required: [true, 'La sección es obligatoria'],
    enum: ['Misión', 'Visión', 'Historia', 'Valores', 'Carreras', 'Contacto'],
    unique: true
  },
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  contenido: {
    type: String,
    required: [true, 'El contenido es obligatorio']
  },
  icono: {
    type: String,
    default: '📚'
  },
  orden: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

infoUniversidadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const InfoUniversidad = mongoose.model('InfoUniversidad', infoUniversidadSchema);

export default InfoUniversidad;
