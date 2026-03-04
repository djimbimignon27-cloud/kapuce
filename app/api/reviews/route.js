import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/lib/models/Review';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';
import { sendReviewNotification } from '@/lib/email';

// GET - Récupérer les avis d'un utilisateur
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ reviewedUserId: userId })
      .populate('reviewerId', 'fullName profilePicture')
      .populate('listingId', 'title')
      .sort({ createdAt: -1 });

    // Calculer la note moyenne
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return NextResponse.json({
      reviews,
      stats: {
        total: reviews.length,
        averageRating: averageRating.toFixed(1),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel avis
export async function POST(request) {
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
    const { rating, comment, reviewedUserId, listingId } = body;

    if (!rating || !comment || !reviewedUserId) {
      return NextResponse.json(
        { error: 'rating, comment et reviewedUserId requis' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La note doit être entre 1 et 5' },
        { status: 400 }
      );
    }

    // Vérifier qu'on ne s'auto-évalue pas
    if (reviewedUserId === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous évaluer vous-même' },
        { status: 400 }
      );
    }

    // Créer l'avis
    const review = await Review.create({
      rating,
      comment,
      reviewerId: auth.userId,
      reviewedUserId,
      listingId: listingId || undefined,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'fullName profilePicture')
      .populate('reviewedUserId', 'fullName email');

    // Envoyer notification
    const reviewedUser = await User.findById(reviewedUserId);
    if (reviewedUser) {
      await sendReviewNotification(reviewedUser.email, {
        rating,
        comment,
        reviewerName: populatedReview.reviewerId.fullName,
      });
    }

    return NextResponse.json(
      {
        message: 'Avis créé avec succès',
        review: populatedReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l\'avis:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
