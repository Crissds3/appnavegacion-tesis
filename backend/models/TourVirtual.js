import mongoose from 'mongoose';

const tourVirtualSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    modeloUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const TourVirtual = mongoose.model('TourVirtual', tourVirtualSchema);

export default TourVirtual;
