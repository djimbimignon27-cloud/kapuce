import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import FraudAlert from '@/lib/models/FraudAlert';
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

// GET - Liste des alertes de fraude
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
    const status = searchParams.get('status'); // PENDING, REVIEWED, DISMISSED, ACTION_TAKEN
    const severity = searchParams.get('severity'); // LOW, MEDIUM, HIGH, CRITICAL
    const type = searchParams.get('type');

    // Construire le filtre
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    if (severity) {
      filter.severity = severity;
    }
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;
    
    const [alerts, total] = await Promise.all([
      FraudAlert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FraudAlert.countDocuments(filter),
    ]);

    // Enrichir avec les infos des utilisateurs
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        const [user, targetUser] = await Promise.all([
          User.findById(alert.userId).select('fullName email phone fraudRiskLevel fraudAlertCount isBanned').lean(),
          alert.targetUserId ? User.findById(alert.targetUserId).select('fullName email').lean() : null,
        ]);
        
        return {
          ...alert,
          user: user || { fullName: 'Utilisateur supprimé' },
          targetUser,
        };
      })
    );

    // Statistiques
    const stats = await FraudAlert.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      alerts: enrichedAlerts,
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste alertes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour une alerte
export async function PUT(request) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { alertId, action, adminNotes } = body;

    if (!alertId || !action) {
      return NextResponse.json({ error: 'ID alerte et action requis' }, { status: 400 });
    }

    const alert = await FraudAlert.findById(alertId);
    if (!alert) {
      return NextResponse.json({ error: 'Alerte non trouvée' }, { status: 404 });
    }

    const updateData = {
      reviewedBy: authCheck.decoded.userId,
      reviewedAt: new Date(),
      adminNotes,
    };

    if (action === 'review') {
      updateData.status = 'REVIEWED';
    } else if (action === 'dismiss') {
      updateData.status = 'DISMISSED';
    } else if (action === 'block_user') {
      updateData.status = 'ACTION_TAKEN';
      updateData.actionTaken = 'Utilisateur bloqué';

      // Bloquer l'utilisateur
      await User.findByIdAndUpdate(alert.userId, {
        isBanned: true,
        banReason: `Bloqué suite à une alerte de fraude: ${alert.type}`,
        bannedAt: new Date(),
        bannedBy: authCheck.decoded.userId,
      });
    } else if (action === 'warn_user') {
      updateData.status = 'ACTION_TAKEN';
      updateData.actionTaken = 'Avertissement envoyé';
      
      // TODO: Envoyer une notification d'avertissement à l'utilisateur
    }

    await FraudAlert.findByIdAndUpdate(alertId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Alerte mise à jour',
    });
  } catch (error) {
    console.error('Erreur mise à jour alerte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
