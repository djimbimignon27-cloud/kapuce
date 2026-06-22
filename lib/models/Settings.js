import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'global_settings',
  },
  commissionRates: {
    client: {
      type: Number,
      default: 7,
      min: 0,
      max: 50,
    },
    owner: {
      type: Number,
      default: 7,
      min: 0,
      max: 50,
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    ref: 'User',
  },
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default Settings;
