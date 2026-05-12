const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const NotificationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    userId: { type: String, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'LISTING_APPROVED', 'LISTING_REJECTED', 'TRANSACTION_INITIATED',
        'PAYMENT_RECEIVED', 'COMMISSION_CHARGED', 'ACCOUNT_BANNED', 'SYSTEM'
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
