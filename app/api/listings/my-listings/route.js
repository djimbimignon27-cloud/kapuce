import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Listing from '@/lib/models/Listing';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }

    // Fetch user's listings
    const listings = await Listing.find({ owner: decoded.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      listings: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('Erreur récupération annonces:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
