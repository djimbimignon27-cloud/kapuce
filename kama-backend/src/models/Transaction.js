const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TransactionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    listingId: { type: String, ref: 'Listing', required: true },
    buyerId: { type: String, ref: 'User', required: true },
    sellerId: { type: String, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, default: 7 },
    commissionAmount: { type: Number, required: true },
    sellerReceives: { type: Number, required: true },
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING_PAYMENT', 'PAID', 'COMPLETED', 'CANCELLED'],
      default: 'INITIATED',
    },
    paymentMethod: {
      type: String,
      enum: ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD'],
      required: true,
    },
    paymentReference: { type: String },
    paidAt: { type: Date },
    completedAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.statics.calculateCommission = function(amount, rate = 7) {
  const commission = Math.round(amount * (rate / 100));
  return {
    commissionAmount: commission,
    sellerReceives: amount - commission,
    commissionRate: rate,
  };
};

module.exports = mongoose.model('Transaction', TransactionSchema);
