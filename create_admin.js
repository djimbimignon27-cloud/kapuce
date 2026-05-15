#!/usr/bin/env node
/**
 * Script to create the superadmin user for KAPUCE.G
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'kapuce_marketplace';

// User Schema (simplified)
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  passwordHash: String,
  role: String,
  isVerified: Boolean,
  emailVerified: Boolean,
  phoneVerified: Boolean,
  identityVerified: Boolean,
  isBanned: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createSuperAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB');

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email: 'superadmin@kama.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Superadmin already exists. Updating password...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('SuperAdminPassword123!', salt);
      
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = 'SUPER_ADMIN';
      existingAdmin.isVerified = true;
      existingAdmin.emailVerified = true;
      existingAdmin.phoneVerified = true;
      existingAdmin.identityVerified = true;
      existingAdmin.isBanned = false;
      
      await existingAdmin.save();
      console.log('✅ Superadmin password updated successfully');
    } else {
      console.log('📝 Creating new superadmin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('SuperAdminPassword123!', salt);
      
      // Create superadmin
      const superAdmin = await User.create({
        fullName: 'Super Admin KAPUCE',
        email: 'superadmin@kama.com',
        phone: '+241077000000',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        isBanned: false,
      });
      
      console.log('✅ Superadmin created successfully');
      console.log('📧 Email: superadmin@kama.com');
      console.log('🔑 Password: SuperAdminPassword123!');
      console.log('👤 Role: SUPER_ADMIN');
    }
    
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSuperAdmin();
