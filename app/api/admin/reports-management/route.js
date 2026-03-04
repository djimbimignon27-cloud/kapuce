import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Report from '@/lib/models/Report';
import { authenticateRequest } from '@/lib/auth';
import { logAdminAction, hasPermission } from '@/lib/adminAuth';

// GET - Récupérer les signalements
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !hasPermission(auth.role, 'handle_reports')) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const reports = await Report.find({ status })
      .populate('reporterId', 'fullName email')
      .populate('reportedUserId', 'fullName email')
      .populate('listingId', 'title type')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Traiter un signalement
export async function PUT(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !hasPermission(auth.role, 'handle_reports')) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { reportId, status, adminNotes, action } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId requis' },
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

    report.status = status || report.status;
    if (adminNotes) report.adminNotes = adminNotes;
    await report.save();

    // Logger l'action
    await logAdminAction({
      adminId: auth.userId,
      action: `Signalement traité: ${report.reason}`,
      targetType: 'REPORT',
      targetId: reportId,
      details: `Status: ${status}, Notes: ${adminNotes || 'N/A'}`,
      request,
    });

    return NextResponse.json({
      message: 'Signalement mis à jour avec succès',
      report,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
