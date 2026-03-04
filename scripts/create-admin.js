#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const DB_NAME = process.env.DB_NAME || 'kama_marketplace';

    console.log('\n🔐 Création d\'un compte SUPER_ADMIN pour KAMA\n');
    
    await mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
    });

    console.log('✅ Connecté à MongoDB\n');

    const UserSchema = new mongoose.Schema({
      fullName: String,
      email: { type: String, unique: true },
      phone: String,
      passwordHash: String,
      role: String,
      emailVerified: Boolean,
      phoneVerified: Boolean,
      identityVerified: Boolean,
      createdAt: { type: Date, default: Date.now },
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Questions
    const fullName = await question('Nom complet de l\'admin: ');
    const email = await question('Email de l\'admin: ');
    const phone = await question('Téléphone: ');
    const password = await question('Mot de passe (min 8 caractères): ');

    if (password.length < 8) {
      console.log('\n❌ Le mot de passe doit contenir au moins 8 caractères');
      process.exit(1);
    }

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('\n❌ Un utilisateur avec cet email existe déjà');
      process.exit(1);
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Créer le super admin
    await User.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      phoneVerified: true,
      identityVerified: true,
    });

    console.log('\n✅ SUPER_ADMIN créé avec succès!');
    console.log('\n📧 Email:', email);
    console.log('🔐 Role: SUPER_ADMIN');
    console.log('\n🌐 Connexion: https://your-domain.com/admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
