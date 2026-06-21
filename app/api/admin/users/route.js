import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Middleware pour vérifier les droits admin
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Non autorisé', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return { error: 'Token invalide', status: 401 };
  }

  const admin = await User.findById(decoded.userId);
  if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return { error: 'Accès refusé', status: 403 };
  }

  return { admin, decoded };
}

// GET - Liste des utilisateurs avec filtres
export async function GET(request) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // active, banned, at_risk
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Construire le filtre
    const filter = {};
    
    if (status === 'banned') {
      filter.isBanned = true;
    } else if (status === 'active') {
      filter.isBanned = { $ne: true };
    } else if (status === 'at_risk') {
      filter.fraudRiskLevel = { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] };
    }

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Exclure les admins de la liste (sauf pour SUPER_ADMIN)
    if (authCheck.admin.role !== 'SUPER_ADMIN') {
      filter.role = { $nin: ['ADMIN', 'SUPER_ADMIN'] };
    }

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Bloquer/Débloquer un utilisateur
export async function PUT(request) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'ID utilisateur et action requis' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Empêcher de bloquer un admin (sauf par SUPER_ADMIN)
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role) && authCheck.admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Vous ne pouvez pas bloquer un administrateur' }, { status: 403 });
    }

    if (action === 'block') {
      await User.findByIdAndUpdate(userId, {
        isBanned: true,
        banReason: reason || 'Bloqué par un administrateur',
        bannedAt: new Date(),
        bannedBy: authCheck.decoded.userId,
      });

      return NextResponse.json({
        success: true,
        message: `L'utilisateur ${user.fullName} a été bloqué`,
      });
    } else if (action === 'unblock') {
      await User.findByIdAndUpdate(userId, {
        isBanned: false,
        banReason: null,
        bannedAt: null,
        bannedBy: null,
      });

      return NextResponse.json({
        success: true,
        message: `L'utilisateur ${user.fullName} a été débloqué`,
      });
    } else if (action === 'update_commission') {
      const { commissionRate } = body;
      if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
        return NextResponse.json({ error: 'Taux de commission invalide (0-100)' }, { status: 400 });
      }

      await User.findByIdAndUpdate(userId, {
        customCommissionRate: commissionRate,
      });

      return NextResponse.json({
        success: true,
        message: `Taux de commission mis à jour: ${commissionRate}%`,
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur action utilisateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
