import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Report from '@/lib/models/Report';
import { authenticateRequest } from '@/lib/auth';

// GET - Récupérer les signalements
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

    let query = {};
    
    // Si admin, voir tous les signalements, sinon seulement les siens
    if (auth.role !== 'ADMIN') {
      query.reporterId = auth.userId;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'fullName email')
      .populate('reportedUserId', 'fullName email')
      .populate('listingId', 'title type')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un signalement
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
    const { reportedUserId, listingId, reason, description } = body;

    if (!reason || !description) {
      return NextResponse.json(
        { error: 'reason et description requis' },
        { status: 400 }
      );
    }

    if (!reportedUserId && !listingId) {
      return NextResponse.json(
        { error: 'reportedUserId ou listingId requis' },
        { status: 400 }
      );
    }

    const report = await Report.create({
      reporterId: auth.userId,
      reportedUserId: reportedUserId || undefined,
      listingId: listingId || undefined,
      reason,
      description,
      status: 'PENDING',
    });

    console.log(`🚨 [REPORT] Nouveau signalement par ${auth.userId}: ${reason}`);

    const populatedReport = await Report.findById(report._id)
      .populate('reporterId', 'fullName email')
      .populate('reportedUserId', 'fullName email')
      .populate('listingId', 'title type');

    return NextResponse.json(
      {
        message: 'Signalement créé avec succès',
        report: populatedReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du signalement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un signalement (admin seulement)
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { reportId, status, adminNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'reportId et status requis' },
        { status: 400 }
      );
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Signalement non trouvé' },
        { status: 404 }
      );
    }

    report.status = status;
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }
    await report.save();

    console.log(`📝 [ADMIN] Signalement mis à jour: ${reportId} -> ${status}`);

    const updatedReport = await Report.findById(reportId)
      .populate('reporterId', 'fullName email')
      .populate('reportedUserId', 'fullName email')
      .populate('listingId', 'title type');

    return NextResponse.json({
      message: 'Signalement mis à jour avec succès',
      report: updatedReport,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du signalement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
