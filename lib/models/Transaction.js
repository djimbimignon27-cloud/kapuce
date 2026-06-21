import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const TransactionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    listingId: {
      type: String,
      ref: 'Listing',
      required: true,
    },
    buyerId: {
      type: String,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: String,
      ref: 'User',
      required: true,
    },
    // Montants
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 7, // 7% par défaut
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerReceives: {
      type: Number,
      required: true,
      min: 0,
    },
    // Statut
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED'],
      default: 'INITIATED',
    },
    // Paiement
    paymentMethod: {
      type: String,
      enum: ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD', 'AIRTEL_MONEY', 'MOOV_MONEY'],
      required: true,
    },
    paymentReference: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    // Informations supplémentaires
    notes: {
      type: String,
    },
    cancelReason: {
      type: String,
    },
    // Type de transaction
    transactionType: {
      type: String,
      enum: ['SALE', 'RENT', 'DEPOSIT'],
      default: 'SALE',
    },
    // Durée de location (si applicable)
    rentalPeriod: {
      startDate: Date,
      endDate: Date,
      durationMonths: Number,
    },
    // Admin modifications
    adminModified: {
      type: Boolean,
      default: false,
    },
    adminModifiedAt: {
      type: Date,
    },
    adminModifiedBy: {
      type: String,
      ref: 'User',
    },
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
TransactionSchema.index({ buyerId: 1, status: 1 });
TransactionSchema.index({ sellerId: 1, status: 1 });
TransactionSchema.index({ listingId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

// Méthode pour calculer la commission
TransactionSchema.statics.calculateCommission = function(amount, rate = 7) {
  const commission = Math.round(amount * (rate / 100));
  return {
    commissionAmount: commission,
    sellerReceives: amount - commission,
    commissionRate: rate,
  };
};

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
