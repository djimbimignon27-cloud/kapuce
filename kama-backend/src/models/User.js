const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
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
      enum: ['USER', 'OWNER', 'AGENCY', 'ADMIN', 'SUPER_ADMIN'],
      default: 'USER',
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    profilePicture: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
