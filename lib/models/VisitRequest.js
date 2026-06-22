import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const VisitRequestSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  listingId: {
    type: String,
    ref: 'Listing',
    required: true,
  },
  requesterId: {
    type: String,
    ref: 'User',
    required: true,
  },
  ownerId: {
    type: String,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
    default: 'PENDING',
  },
  message: {
    type: String,
  },
  proposedDate: {
    type: Date,
  },
  acceptedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VisitRequest = mongoose.models.VisitRequest || mongoose.model('VisitRequest', VisitRequestSchema);

export default VisitRequest;
