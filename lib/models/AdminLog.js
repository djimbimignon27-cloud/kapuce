import mongoose from 'mongoose';

const AdminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['USER', 'LISTING', 'PAYMENT', 'REPORT', 'SYSTEM'],
      required: true,
    },
    targetId: {
      type: String,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ targetType: 1, targetId: 1 });
AdminLogSchema.index({ createdAt: -1 });

export default mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);
