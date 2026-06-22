import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import VisitRequest from '@/lib/models/VisitRequest';
import Listing from '@/lib/models/Listing';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import { authenticateRequest } from '@/lib/auth';

// POST - Créer une demande de visite
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { listingId, message } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'ID annonce requis' }, { status: 400 });
    }

    // Récupérer l'annonce
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur n'est pas le propriétaire
    if (listing.ownerId.toString() === auth.userId) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas demander une visite de votre propre annonce' 
      }, { status: 400 });
    }

    // Vérifier s'il existe déjà une demande en attente
    const existingRequest = await VisitRequest.findOne({
      listingId,
      requesterId: auth.userId,
      status: 'PENDING',
    });

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'Vous avez déjà une demande de visite en attente pour cette annonce' 
      }, { status: 400 });
    }

    // Créer la demande de visite
    const visitRequest = new VisitRequest({
      listingId,
      requesterId: auth.userId,
      ownerId: listing.ownerId,
      message: message || 'Je souhaiterais visiter ce bien.',
      status: 'PENDING',
    });

    await visitRequest.save();

    // Créer ou récupérer la conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [auth.userId, listing.ownerId.toString()] },
      listingId,
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [auth.userId, listing.ownerId.toString()],
        listingId,
        listingTitle: listing.title,
        isActive: true,
      });
      await conversation.save();
    }

    // Créer un message automatique
    const autoMessage = new Message({
      conversationId: conversation._id,
      senderId: 'SYSTEM',
      receiverId: listing.ownerId,
      content: `📅 Nouvelle demande de visite pour "${listing.title}"\n\n${message || 'L\'utilisateur souhaite visiter ce bien.'}\n\nVeuillez accepter ou refuser cette demande dans la messagerie.`,
      status: 'SENT',
      isSystemMessage: true,
    });
    await autoMessage.save();

    // Mettre à jour la conversation
    conversation.lastMessage = {
      content: autoMessage.content,
      senderId: 'SYSTEM',
      createdAt: new Date(),
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    return NextResponse.json({
      success: true,
      message: 'Demande de visite envoyée au propriétaire',
      visitRequest: {
        _id: visitRequest._id,
        status: visitRequest.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création demande visite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Récupérer les demandes de visite de l'utilisateur
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    const query = listingId 
      ? { listingId, requesterId: auth.userId }
      : { requesterId: auth.userId };

    const visitRequests = await VisitRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      visitRequests,
    });
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Accepter/Refuser une demande de visite (propriétaire)
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { visitRequestId, action } = body;

    if (!visitRequestId || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const visitRequest = await VisitRequest.findById(visitRequestId);
    if (!visitRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien le propriétaire
    if (visitRequest.ownerId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (action === 'ACCEPT') {
      visitRequest.status = 'ACCEPTED';
      visitRequest.acceptedAt = new Date();
    } else if (action === 'REJECT') {
      visitRequest.status = 'REJECTED';
      visitRequest.rejectedAt = new Date();
    } else if (action === 'COMPLETE') {
      visitRequest.status = 'COMPLETED';
      visitRequest.completedAt = new Date();
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    await visitRequest.save();

    return NextResponse.json({
      success: true,
      message: `Demande ${action === 'ACCEPT' ? 'acceptée' : action === 'REJECT' ? 'refusée' : 'marquée comme complétée'}`,
      visitRequest,
    });
  } catch (error) {
    console.error('Erreur mise à jour demande:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
