import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';

// PUT - Débannir un utilisateur
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    user.isBanned = false;
    user.unbannedAt = new Date();
    user.unbannedBy = auth.userId;
    await user.save();

    console.log(`✅ [ADMIN] Utilisateur débloqué: ${user.email} par ${auth.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur débloqué',
      user: { _id: user._id, email: user.email, isBanned: user.isBanned },
    });
  } catch (error) {
    console.error('Erreur lors du déblocage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
