const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FavoriteSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, ref: 'User', required: true },
    listingId: { type: String, ref: 'Listing', required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
