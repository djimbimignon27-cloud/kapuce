// Service de Paiement Mocké pour KAMA

const PAYMENT_MOCK_MODE = process.env.PAYMENT_MOCK_MODE === 'true';
const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || '0.07');

export const calculateCommission = (amount) => {
  return amount * COMMISSION_RATE;
};

export const processPayment = async (paymentData) => {
  const { amount, buyerId, sellerId, listingId, paymentMethod } = paymentData;
  
  if (PAYMENT_MOCK_MODE) {
    console.log('💳 [MOCK] Paiement en cours...');
    console.log('💰 [MOCK] Montant:', amount);
    console.log('👤 [MOCK] Acheteur:', buyerId);
    console.log('👤 [MOCK] Vendeur:', sellerId);
    console.log('🏠 [MOCK] Annonce:', listingId);
    console.log('💳 [MOCK] Méthode:', paymentMethod);
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler un succès (95% du temps)
    const success = Math.random() > 0.05;
    
    if (success) {
      console.log('✅ [MOCK] Paiement réussi!');
      return {
        success: true,
        transactionId: `MOCK_TXN_${Date.now()}`,
        commission: calculateCommission(amount),
        mock: true
      };
    } else {
      console.log('❌ [MOCK] Paiement échoué!');
      return {
        success: false,
        error: 'Simulation d\'échec de paiement',
        mock: true
      };
    }
  }
  
  // TODO: Intégrer Stripe ici quand les clés API seront disponibles
  return {
    success: true,
    transactionId: `MOCK_TXN_${Date.now()}`,
    commission: calculateCommission(amount),
    mock: true
  };
};

export const refundPayment = async (transactionId) => {
  if (PAYMENT_MOCK_MODE) {
    console.log('💸 [MOCK] Remboursement de la transaction:', transactionId);
    return { success: true, mock: true };
  }
  
  return { success: true, mock: true };
};
