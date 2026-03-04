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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const filter = { userId: auth.userId };
    if (unreadOnly) {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: auth.userId,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Marquer une notification comme lue
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
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await Notification.updateMany(
        { userId: auth.userId, read: false },
        { read: true }
      );
      return NextResponse.json({
        message: 'Toutes les notifications marquées comme lues',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId requis' },
        { status: 400 }
      );
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: auth.userId,
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({
      message: 'Notification marquée comme lue',
      notification,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
