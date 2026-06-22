import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/lib/models/Settings';

// GET - Récupérer les taux de commission (route publique)
export async function GET() {
  try {
    await connectDB();
    
    let settings = await Settings.findById('global_settings');
    
    if (!settings) {
      // Créer paramètres par défaut
      settings = new Settings({
        _id: 'global_settings',
        commissionRates: { client: 7, owner: 7 },
      });
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings: {
        commissionRates: settings.commissionRates,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    // Retourner valeurs par défaut en cas d'erreur
    return NextResponse.json({
      success: true,
      settings: {
        commissionRates: { client: 7, owner: 7 },
      },
    });
  }
}
