import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['USER', 'OWNER', 'AGENCY', 'ADMIN'],
      default: 'USER',
    },
    // Vérifications
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    identityVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    // Informations complémentaires pour propriétaires/agences
    cniNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    agencyName: {
      type: String,
    },
    agencyLicense: {
      type: String,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    // Bannissement
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
    },
    // Statistiques de confiance
    transactionsCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
