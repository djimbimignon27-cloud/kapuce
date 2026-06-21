import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const FraudAlertSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  type: {
    type: String,
    enum: ['PHONE_NUMBER', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'EXTERNAL_PAYMENT', 'MEET_OUTSIDE', 'OTHER'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  targetUserId: {
    type: String,
    ref: 'User',
  },
  conversationId: {
    type: String,
    ref: 'Conversation',
  },
  messageId: {
    type: String,
    ref: 'Message',
  },
  originalContent: {
    type: String,
    required: true,
  },
  detectedPattern: {
    type: String, // Le pattern détecté (numéro, email, etc.)
  },
  status: {
    type: String,
    enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'],
    default: 'PENDING',
  },
  adminNotes: {
    type: String,
  },
  reviewedBy: {
    type: String,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  actionTaken: {
    type: String, // Description de l'action prise
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

FraudAlertSchema.index({ userId: 1 });
FraudAlertSchema.index({ status: 1 });
FraudAlertSchema.index({ createdAt: -1 });

const FraudAlert = mongoose.models.FraudAlert || mongoose.model('FraudAlert', FraudAlertSchema);

export default FraudAlert;
