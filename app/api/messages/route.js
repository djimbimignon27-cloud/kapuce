import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import FraudAlert from '@/lib/models/FraudAlert';
import { analyzeMessage, calculateRiskLevel, getWarningMessage } from '@/lib/services/antiFraudService';
import jwt from 'jsonwebtoken';

// GET - Récupérer les messages d'une conversation
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(decoded.userId)) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Récupérer les messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    // Marquer les messages comme lus
    await Message.updateMany(
      { conversationId, receiverId: decoded.userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Mettre à jour le compteur de non-lus
    conversation.unreadCount.set(decoded.userId, 0);
    await conversation.save();

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Erreur messages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Envoyer un message
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
    const { conversationId, content } = body;

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation et contenu requis' }, { status: 400 });
    }

    // Vérifier l'utilisateur
    const sender = await User.findById(decoded.userId);
    if (!sender) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    if (sender.isBanned) {
      return NextResponse.json({ error: 'Votre compte est bloqué' }, { status: 403 });
    }

    // Vérifier la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(decoded.userId)) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    const receiverId = conversation.participants.find(p => p !== decoded.userId);

    // ========== SYSTÈME ANTI-FRAUDE ==========
    const fraudAnalysis = analyzeMessage(content);
    
    let finalContent = content;
    let isFiltered = false;
    let filterReason = null;
    let warningMessage = null;

    if (fraudAnalysis.isSuspicious) {
      isFiltered = true;
      filterReason = fraudAnalysis.alertType;
      finalContent = fraudAnalysis.filteredContent;
      warningMessage = getWarningMessage(fraudAnalysis.alertType);

      // Créer une alerte de fraude
      const fraudAlert = new FraudAlert({
        type: fraudAnalysis.alertType,
        severity: fraudAnalysis.severity,
        userId: decoded.userId,
        targetUserId: receiverId,
        conversationId,
        originalContent: content,
        detectedPattern: JSON.stringify(fraudAnalysis.detectedPatterns),
        status: 'PENDING',
      });
      await fraudAlert.save();

      // Mettre à jour le compteur d'alertes de l'utilisateur
      const newAlertCount = (sender.fraudAlertCount || 0) + 1;
      const newRiskLevel = calculateRiskLevel(newAlertCount);
      
      await User.findByIdAndUpdate(decoded.userId, {
        fraudAlertCount: newAlertCount,
        fraudRiskLevel: newRiskLevel,
        lastFraudAlertAt: new Date(),
      });

      // Si le niveau de risque est critique, bloquer automatiquement
      if (newRiskLevel === 'CRITICAL' && newAlertCount >= 10) {
        await User.findByIdAndUpdate(decoded.userId, {
          isBanned: true,
          banReason: 'Tentatives répétées de contournement de la plateforme',
          bannedAt: new Date(),
        });

        return NextResponse.json({
          error: 'Votre compte a été bloqué suite à des tentatives répétées de contournement de la plateforme.',
          blocked: true,
        }, { status: 403 });
      }
    }
    // ========== FIN SYSTÈME ANTI-FRAUDE ==========

    // Créer le message
    const message = new Message({
      conversationId,
      senderId: decoded.userId,
      receiverId,
      content: finalContent,
      originalContent: isFiltered ? content : undefined,
      isFiltered,
      filterReason,
      listingId: conversation.listingId,
    });
    await message.save();

    // Mettre à jour la conversation
    conversation.lastMessage = {
      content: finalContent.substring(0, 100),
      senderId: decoded.userId,
      createdAt: new Date(),
    };
    conversation.unreadCount.set(receiverId, (conversation.unreadCount.get(receiverId) || 0) + 1);
    conversation.updatedAt = new Date();
    await conversation.save();

    return NextResponse.json({
      success: true,
      message: message.toObject(),
      warning: warningMessage,
      isFiltered,
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
