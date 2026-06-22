import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/lib/models/Settings';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Middleware admin
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

// GET - Récupérer les paramètres
export async function GET(request) {
  try {
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectDB();
    
    let settings = await Settings.findById('global_settings');
    
    // Créer les paramètres par défaut si inexistants
    if (!settings) {
      settings = new Settings({
        _id: 'global_settings',
        commissionRates: {
          client: 7,
          owner: 7,
        },
      });
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour les paramètres
export async function PUT(request) {
  try {
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectDB();
    const body = await request.json();
    const { commissionRates } = body;

    if (!commissionRates || 
        typeof commissionRates.client !== 'number' || 
        typeof commissionRates.owner !== 'number') {
      return NextResponse.json({ 
        error: 'Taux de commission invalides' 
      }, { status: 400 });
    }

    if (commissionRates.client < 0 || commissionRates.client > 50 ||
        commissionRates.owner < 0 || commissionRates.owner > 50) {
      return NextResponse.json({ 
        error: 'Les taux doivent être entre 0% et 50%' 
      }, { status: 400 });
    }

    let settings = await Settings.findById('global_settings');
    
    if (!settings) {
      settings = new Settings({
        _id: 'global_settings',
        commissionRates,
        updatedBy: authCheck.decoded.userId,
      });
    } else {
      settings.commissionRates = commissionRates;
      settings.updatedAt = new Date();
      settings.updatedBy = authCheck.decoded.userId;
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Taux de commission mis à jour',
      settings,
    });
  } catch (error) {
    console.error('Erreur mise à jour settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
