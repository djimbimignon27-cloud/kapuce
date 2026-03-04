import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur admin
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Vérifier que c'est bien un admin
    if (!['SUPER_ADMIN', 'ADMIN_MODERATOR', 'ADMIN_FINANCE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier si banni
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Compte suspendu' },
        { status: 403 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Générer tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Sauvegarder refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Logger la connexion
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    console.log(`🔐 [ADMIN LOGIN] ${user.email} (${user.role}) from IP: ${ipAddress}`);

    return NextResponse.json({
      message: 'Connexion admin réussie',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
