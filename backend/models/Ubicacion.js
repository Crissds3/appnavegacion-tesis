import mongoose from 'mongoose';

const ubicacionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la ubicación es obligatorio'],
    trim: true
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de ubicación es obligatorio'],
    enum: ['edificio', 'biblioteca', 'casino', 'cancha', 'laboratorio', 'entrada', 'estacionamiento', 'servicio', 'otro'],
    default: 'otro'
  },
  descripcion: {
    type: String,
    trim: true
  },
  // GeoJSON Point según especificación MongoDB
  ubicacion: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true,
      validate: {
        validator: function(coords) {
          // Validar que tenga exactamente 2 coordenadas
          if (coords.length !== 2) return false;
          
          const [lng, lat] = coords;
          // Validar rangos: longitud [-180, 180], latitud [-90, 90]
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: 'Las coordenadas deben ser [longitud, latitud] válidas'
      }
    }
  },
  icono: {
    type: String,
    default: 'marker'
  },
  categoria: {
    type: String,
    enum: ['edificio', 'biblioteca', 'casino', 'cancha', 'laboratorio', 'entrada', 'estacionamiento', 'servicio', 'otro'],
    default: 'edificio'
  },
  visible: {
    type: Boolean,
    default: true
  },
  metadatos: {
    piso: Number,
    capacidad: Number,
    horario: String,
    contacto: String,
    url: String
  }
}, {
  timestamps: true
});

// Índice geoespacial 2dsphere para consultas de proximidad
ubicacionSchema.index({ ubicacion: '2dsphere' });

// Índice para búsquedas por tipo
ubicacionSchema.index({ tipo: 1, visible: 1 });

// Método virtual para obtener coordenadas en formato [lat, lng] para Leaflet
ubicacionSchema.virtual('coordenadasLeaflet').get(function() {
  if (this.ubicacion && this.ubicacion.coordinates) {
    const [lng, lat] = this.ubicacion.coordinates;
    return [lat, lng];
  }
  return null;
});

// Configurar para incluir virtuals en JSON
ubicacionSchema.set('toJSON', { virtuals: true });
ubicacionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Ubicacion', ubicacionSchema);
