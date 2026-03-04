import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['HOUSE', 'LAND', 'CAR'],
      required: true,
    },
    category: {
      type: String,
      enum: ['RENT', 'SALE'],
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    // Médias (max 5 photos + 1 vidéo)
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 photos autorisées'
      },
    },
    video: {
      type: String,
      default: '',
    },
    // Statut des médias
    mediaStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    mediaRejectionReason: {
      type: String,
    },
    rejectedMedia: {
      images: [String],
      video: String,
      reason: String,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SOLD', 'RENTED', 'PENDING'],
      default: 'PENDING',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
    },
    // Champs spécifiques selon le type
    bedrooms: Number,
    bathrooms: Number,
    surface: Number,
    year: Number,
    mileage: Number,
    brand: String,
    model: String,
    fuel: String,
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
ListingSchema.index({ type: 1, category: 1, city: 1 });
ListingSchema.index({ price: 1 });
ListingSchema.index({ status: 1 });
ListingSchema.index({ verified: 1 });
ListingSchema.index({ ownerId: 1 });
ListingSchema.index({ mediaStatus: 1 });

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
