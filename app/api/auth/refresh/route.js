import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token requis' },
        { status: 400 }
      );
    }

    // Vérifier le refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Refresh token invalide ou expiré' },
        { status: 401 }
      );
    }

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token invalide' },
        { status: 401 }
      );
    }

    // Générer nouveaux tokens
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Sauvegarder le nouveau refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Erreur lors du refresh:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du refresh' },
      { status: 500 }
    );
  }
}
