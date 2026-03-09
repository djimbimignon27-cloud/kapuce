import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer les notifications de l'utilisateur
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const skip = (page - 1) * limit;

    const filter = { userId: auth.userId };
    if (unreadOnly) {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      userId: auth.userId, 
      read: false 
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Marquer des notifications comme lues
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Marquer toutes les notifications comme lues
      await Notification.updateMany(
        { userId: auth.userId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      return NextResponse.json({ 
        success: true, 
        message: 'Toutes les notifications marquées comme lues' 
      });
    }

    if (notificationIds && notificationIds.length > 0) {
      // Marquer des notifications spécifiques comme lues
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: auth.userId },
        { $set: { read: true, readAt: new Date() } }
      );
      return NextResponse.json({ 
        success: true, 
        message: `${notificationIds.length} notification(s) marquée(s) comme lue(s)` 
      });
    }

    return NextResponse.json(
      { error: 'Aucune notification spécifiée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer des notifications
export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';
    const deleteRead = searchParams.get('deleteRead') === 'true';

    if (deleteAll) {
      await Notification.deleteMany({ userId: auth.userId });
      return NextResponse.json({ 
        success: true, 
        message: 'Toutes les notifications supprimées' 
      });
    }

    if (deleteRead) {
      await Notification.deleteMany({ userId: auth.userId, read: true });
      return NextResponse.json({ 
        success: true, 
        message: 'Notifications lues supprimées' 
      });
    }

    if (notificationId) {
      await Notification.deleteOne({ _id: notificationId, userId: auth.userId });
      return NextResponse.json({ 
        success: true, 
        message: 'Notification supprimée' 
      });
    }

    return NextResponse.json(
      { error: 'Aucune notification spécifiée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur suppression notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
