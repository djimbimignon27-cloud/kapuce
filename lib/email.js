// Service Email Mocké pour KAMA

const EMAIL_MOCK_MODE = process.env.EMAIL_MOCK_MODE === 'true';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@kama-gabon.com';

export const sendVerificationEmail = async (email, verificationToken) => {
  if (EMAIL_MOCK_MODE) {
    console.log('📧 [MOCK] Email de vérification envoyé à:', email);
    console.log('🔗 [MOCK] Token de vérification:', verificationToken);
    console.log('🔗 [MOCK] Lien de vérification:', `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify?token=${verificationToken}`);
    return { success: true, mock: true };
  }
  
  // TODO: Intégrer SendGrid ici quand les clés API seront disponibles
  return { success: true, mock: true };
};

export const sendTransactionEmail = async (email, transactionDetails) => {
  if (EMAIL_MOCK_MODE) {
    console.log('📧 [MOCK] Email de transaction envoyé à:', email);
    console.log('💰 [MOCK] Détails:', transactionDetails);
    return { success: true, mock: true };
  }
  
  return { success: true, mock: true };
};

export const sendReviewNotification = async (email, reviewDetails) => {
  if (EMAIL_MOCK_MODE) {
    console.log('📧 [MOCK] Notification de review envoyée à:', email);
    console.log('⭐ [MOCK] Détails:', reviewDetails);
    return { success: true, mock: true };
  }
  
  return { success: true, mock: true };
};

export const sendContactEmail = async (toEmail, fromEmail, message) => {
  if (EMAIL_MOCK_MODE) {
    console.log('📧 [MOCK] Email de contact envoyé');
    console.log('📤 [MOCK] De:', fromEmail, 'À:', toEmail);
    console.log('💬 [MOCK] Message:', message);
    return { success: true, mock: true };
  }
  
  return { success: true, mock: true };
};
