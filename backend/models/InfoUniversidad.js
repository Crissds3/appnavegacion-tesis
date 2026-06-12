import mongoose from 'mongoose';

const infoUniversidadSchema = new mongoose.Schema({
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

// El campo "seccion" se eliminó del esquema; se borra el índice único
// antiguo si existe para no bloquear la creación de nuevos documentos.
InfoUniversidad.collection.dropIndex('seccion_1').catch(() => {});

export default InfoUniversidad;
