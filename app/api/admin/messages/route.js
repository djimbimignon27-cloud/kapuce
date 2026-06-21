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

// GET - Liste de toutes les conversations (pour admin)
export async function GET(request) {
  try {
    await connectDB();
    
    const authCheck = await verifyAdmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const userId = searchParams.get('userId'); // Filtrer par utilisateur
    const filter = searchParams.get('filter') || 'ALL'; // ALL, FLAGGED, SUSPICIOUS

    // Construire le filtre de base
    const query = { isActive: true };
    
    if (userId) {
      query.participants = userId;
    }

    // Pour les conversations avec messages filtrés
    let conversationIds = [];
    if (filter === 'FLAGGED') {
      // Conversations avec au moins 1 message filtré
      const flaggedConversations = await Message.find({ isFiltered: true }).distinct('conversationId');
      conversationIds = flaggedConversations;
      query._id = { $in: conversationIds };
    } else if (filter === 'SUSPICIOUS') {
      // Conversations avec plusieurs messages filtrés (récidive)
      const suspiciousConversations = await Message.aggregate([
        { $match: { isFiltered: true } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } },
        { $match: { count: { $gte: 2 } } },
      ]);
      conversationIds = suspiciousConversations.map(c => c._id);
      query._id = { $in: conversationIds };
    }

    const skip = (page - 1) * limit;
    
    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    // Enrichir avec les infos des participants
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await User.find({
          _id: { $in: conv.participants }
        }).select('fullName email role isBanned fraudRiskLevel').lean();
        
        // Compter les messages filtrés dans cette conversation
        const filteredMessagesCount = await Message.countDocuments({
          conversationId: conv._id,
          isFiltered: true,
        });
        
        return {
          ...conv,
          participants,
          filteredMessagesCount,
          hasFlaggedMessages: filteredMessagesCount > 0,
        };
      })
    );

    // Statistiques
    const totalMessages = await Message.countDocuments({});
    const filteredMessages = await Message.countDocuments({ isFiltered: true });

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
      stats: {
        totalConversations: total,
        totalMessages,
        filteredMessages,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur admin conversations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
