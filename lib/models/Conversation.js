import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ConversationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  participants: [{
    type: String,
    ref: 'User',
  }],
  listingId: {
    type: String,
    ref: 'Listing',
  },
  listingTitle: {
    type: String,
  },
  lastMessage: {
    content: String,
    senderId: String,
    createdAt: Date,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isSystemConversation: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);

export default Conversation;
