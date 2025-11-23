import mongoose from 'mongoose';

const noticiaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  contenido: {
    type: String,
    required: [true, 'El contenido es obligatorio']
  },
  tipo: {
    type: String,
    enum: ['Noticia', 'Evento', 'Anuncio'],
    default: 'Noticia'
  },
  categoria: {
    type: String,
    enum: ['Académico', 'Cultural', 'Deportivo', 'Institucional', 'Investigación', 'General'],
    default: 'General'
  },
  imagenUrl: {
    type: String,
    default: ''
  },
  imagenBase64: {
    type: String,
    default: ''
  },
  fechaEvento: {
    type: Date
  },
  ubicacionEvento: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  destacado: {
    type: Boolean,
    default: false
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar fecha de modificación
noticiaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Noticia = mongoose.model('Noticia', noticiaSchema);

export default Noticia;
