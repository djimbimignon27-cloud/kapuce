const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ListingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['HOUSE', 'CAR', 'LAND'],
      required: true,
    },
    category: {
      type: String,
      enum: ['SALE', 'RENT'],
      required: true,
    },
    subCategory: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REJECTED', 'SOLD', 'EXPIRED'],
      default: 'PENDING',
    },
    ownerId: { type: String, ref: 'User', required: true },
    city: { type: String, required: true },
    neighborhood: { type: String },
    address: { type: String },
    images: [{ url: String, publicId: String }],
    video: { url: String, publicId: String },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    rejectionReason: { type: String },
    viewsCount: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    // Détails spécifiques
    propertyDetails: {
      surface: Number,
      bedrooms: Number,
      bathrooms: Number,
      furnished: String,
      condition: String,
      amenities: [String],
    },
    vehicleDetails: {
      brand: String,
      model: String,
      year: Number,
      mileage: Number,
      fuel: String,
      transmission: String,
      condition: String,
    },
    landDetails: {
      surface: Number,
      topography: String,
      boundaryMarked: Boolean,
      accessibility: [String],
    },
  },
  { timestamps: true }
);

ListingSchema.index({ status: 1, type: 1 });
ListingSchema.index({ city: 1 });
ListingSchema.index({ ownerId: 1 });
ListingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Listing', ListingSchema);
