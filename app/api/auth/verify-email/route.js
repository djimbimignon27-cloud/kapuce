import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token de vérification requis' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.json(
        { error: 'Token de vérification invalide' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: 'Email déjà vérifié' },
        { status: 200 }
      );
    }

    // Vérifier l'email
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return NextResponse.json({
      message: 'Email vérifié avec succès!',
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la vérification' },
      { status: 500 }
    );
  }
}
