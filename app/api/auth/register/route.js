import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { fullName, email, phone, password, role } = body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // Hash du mot de passe
    const passwordHash = await hashPassword(password);

    // Générer token de vérification
    const verificationToken = uuidv4();

    // Créer l'utilisateur
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: role || 'USER',
      verificationToken,
      isVerified: false,
    });

    // Envoyer email de vérification
    await sendVerificationEmail(email, verificationToken);

    // Générer tokens JWT
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Sauvegarder refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return NextResponse.json(
      {
        message: 'Inscription réussie! Vérifiez votre email.',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
