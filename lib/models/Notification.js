import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const NotificationSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'MEDIA_REJECTED',
        'LISTING_APPROVED',
        'LISTING_REJECTED',
        'LISTING_EXPIRED',
        'NEW_MESSAGE',
        'NEW_FAVORITE',
        'PRICE_DROP',
        'TRANSACTION_INITIATED',
        'TRANSACTION_COMPLETED',
        'PAYMENT_RECEIVED',
        'COMMISSION_CHARGED',
        'ACCOUNT_VERIFIED',
        'ACCOUNT_BANNED',
        'REVIEW',
        'SYSTEM'
      ],
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
      enum: ['LISTING', 'TRANSACTION', 'REVIEW', 'USER', 'PAYMENT'],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
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
