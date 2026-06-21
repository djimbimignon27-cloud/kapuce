import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MessageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User',
  },
  receiverId: {
    type: String,
    required: true,
    ref: 'User',
  },
  content: {
    type: String,
    required: true,
  },
  originalContent: {
    type: String, // Contenu original avant filtrage anti-fraude
  },
  isFiltered: {
    type: Boolean,
    default: false,
  },
  filterReason: {
    type: String, // Raison du filtrage (numéro, email, etc.)
  },
  listingId: {
    type: String,
    ref: 'Listing',
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index pour les recherches rapides
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;
