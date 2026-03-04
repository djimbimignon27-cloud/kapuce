import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
ReviewSchema.index({ reviewedUserId: 1 });
ReviewSchema.index({ reviewerId: 1 });
ReviewSchema.index({ rating: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
