import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';
import { logAdminAction, hasPermission } from '@/lib/adminAuth';

// GET - Récupérer tous les utilisateurs avec filtres
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !hasPermission(auth.role, 'manage_users')) {
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
    
    const role = searchParams.get('role');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');

    // Construire le filtre
    const filter = {};
    if (role) filter.role = role;
    if (verified === 'true') {
      filter.emailVerified = true;
      filter.phoneVerified = true;
      filter.identityVerified = true;
    } else if (verified === 'false') {
      filter.$or = [
        { emailVerified: false },
        { phoneVerified: false },
        { identityVerified: false },
      ];
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

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
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !hasPermission(auth.role, 'manage_users')) {
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

    let actionDescription = '';

    switch (action) {
      case 'ban':
        user.isBanned = true;
        user.banReason = data?.reason || 'Non spécifié';
        actionDescription = `Utilisateur banni: ${user.email}`;
        break;

      case 'unban':
        user.isBanned = false;
        user.banReason = undefined;
        actionDescription = `Utilisateur débanni: ${user.email}`;
        break;

      case 'verify_email':
        user.emailVerified = true;
        actionDescription = `Email vérifié: ${user.email}`;
        break;

      case 'verify_phone':
        user.phoneVerified = true;
        actionDescription = `Téléphone vérifié: ${user.email}`;
        break;

      case 'verify_identity':
        user.identityVerified = true;
        actionDescription = `Identité vérifiée: ${user.email}`;
        break;

      case 'change_role':
        if (!['USER', 'OWNER', 'AGENCY'].includes(data?.role)) {
          return NextResponse.json(
            { error: 'Rôle invalide' },
            { status: 400 }
          );
        }
        user.role = data.role;
        actionDescription = `Rôle changé: ${user.email} -> ${data.role}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }

    await user.save();

    // Logger l'action
    await logAdminAction({
      adminId: auth.userId,
      action: actionDescription,
      targetType: 'USER',
      targetId: userId,
      details: JSON.stringify(data),
      request,
    });

    return NextResponse.json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        identityVerified: user.identityVerified,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
