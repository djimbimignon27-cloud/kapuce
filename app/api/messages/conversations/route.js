import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// GET - Récupérer les conversations de l'utilisateur
export async function GET(request) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier si l'utilisateur est bloqué
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    if (user.isBanned) {
      return NextResponse.json({ error: 'Votre compte est bloqué' }, { status: 403 });
    }

    // Récupérer les conversations
    const conversations = await Conversation.find({
      participants: decoded.userId,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Enrichir avec les infos des participants
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(p => p !== decoded.userId);
        const otherUser = await User.findById(otherParticipantId).select('fullName profilePicture role').lean();
        
        return {
          ...conv,
          otherParticipant: otherUser || { fullName: 'Utilisateur supprimé' },
          unreadCount: conv.unreadCount?.get(decoded.userId) || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
    });
  } catch (error) {
    console.error('Erreur conversations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer ou récupérer une conversation
export async function POST(request) {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, listingId, listingTitle } = body;

    if (!receiverId) {
      return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 });
    }

    // Vérifier si les deux utilisateurs existent et ne sont pas bloqués
    const [sender, receiver] = await Promise.all([
      User.findById(decoded.userId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    if (sender.isBanned) {
      return NextResponse.json({ error: 'Votre compte est bloqué' }, { status: 403 });
    }
    if (receiver.isBanned) {
      return NextResponse.json({ error: 'Ce compte est indisponible' }, { status: 403 });
    }

    // Chercher une conversation existante
    let conversation = await Conversation.findOne({
      participants: { $all: [decoded.userId, receiverId] },
      ...(listingId && { listingId }),
    });

    if (!conversation) {
      // Créer une nouvelle conversation
      conversation = new Conversation({
        participants: [decoded.userId, receiverId],
        listingId,
        listingTitle,
        unreadCount: new Map(),
      });
      await conversation.save();
    }

    // Récupérer les infos de l'autre participant
    const otherUser = await User.findById(receiverId).select('fullName profilePicture role').lean();

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation.toObject(),
        otherParticipant: otherUser,
      },
    });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
