import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

// POST - Générer une signature pour l'upload côté client
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { folder = 'kama/listings', resourceType = 'image' } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const paramsToSign = {
      timestamp,
      folder,
    };

    // Générer la signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    console.error('Erreur génération signature:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
