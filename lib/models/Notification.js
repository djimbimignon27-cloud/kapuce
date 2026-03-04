import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['MEDIA_REJECTED', 'LISTING_APPROVED', 'LISTING_REJECTED', 'TRANSACTION', 'REVIEW', 'SYSTEM'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: String,
    },
    relatedType: {
      type: String,
      enum: ['LISTING', 'TRANSACTION', 'REVIEW'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
