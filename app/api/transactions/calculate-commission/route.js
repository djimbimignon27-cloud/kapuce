import { NextResponse } from 'next/server';

// Taux de commission par défaut
const DEFAULT_COMMISSION_RATE = 7;

// GET - Calculer la commission pour un montant donné
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount'));
    const rate = parseFloat(searchParams.get('rate')) || DEFAULT_COMMISSION_RATE;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const commissionAmount = Math.round(amount * (rate / 100));
    const sellerReceives = amount - commissionAmount;

    return NextResponse.json({
      amount,
      commissionRate: rate,
      commissionAmount,
      sellerReceives,
      breakdown: {
        totalPrice: amount,
        platformFee: commissionAmount,
        sellerAmount: sellerReceives,
        feePercentage: `${rate}%`,
      },
    });
  } catch (error) {
    console.error('Erreur calcul commission:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
