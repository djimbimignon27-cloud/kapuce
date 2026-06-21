import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
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

// GET - Messages d'une conversation spécifique (admin)
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const conversationId = params.id;

    // Vérifier que la conversation existe
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Récupérer tous les messages de cette conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    // Enrichir avec les infos des expéditeurs
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await User.findById(msg.senderId).select('fullName email profilePicture').lean();
        return {
          ...msg,
          sender: sender || { fullName: 'Utilisateur supprimé' },
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: enrichedMessages,
      conversation,
    });
  } catch (error) {
    console.error('Erreur messages admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
