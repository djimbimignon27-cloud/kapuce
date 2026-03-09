import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer tous les utilisateurs
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un utilisateur (bannir, vérifier, changer role)
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { userId, action, data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId et action requis' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'ban':
        user.isBanned = true;
        user.banReason = data?.reason || 'Non spécifié';
        console.log(`🚫 [ADMIN] Utilisateur banni: ${user.email} - Raison: ${user.banReason}`);
        break;

      case 'unban':
        user.isBanned = false;
        user.banReason = undefined;
        console.log(`✅ [ADMIN] Utilisateur débanni: ${user.email}`);
        break;

      case 'verify':
        user.isVerified = true;
        user.verificationToken = undefined;
        break;

      case 'changeRole':
        if (!['USER', 'OWNER', 'ADMIN'].includes(data?.role)) {
          return NextResponse.json(
            { error: 'Rôle invalide' },
            { status: 400 }
          );
        }
        user.role = data.role;
        console.log(`🔄 [ADMIN] Rôle changé: ${user.email} -> ${data.role}`);
        break;

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }

    await user.save();

    return NextResponse.json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
        banReason: user.banReason,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
