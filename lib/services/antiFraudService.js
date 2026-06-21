// Service Anti-Fraude pour KAPUCE.G
// Détecte et filtre les tentatives de contournement de la plateforme

// Patterns de détection des numéros de téléphone
const PHONE_PATTERNS = [
  // Format international et local Gabon
  /(?:\+?241|00241)?[\s.-]?(?:0?[1-9])[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/gi,
  // Format générique international
  /(?:\+|00)?[\d]{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/gi,
  // Numéros écrits avec mots
  /(?:zero|zéro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)[\s]?(?:zero|zéro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)/gi,
  // Numéros séparés par des espaces/tirets
  /\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d/gi,
];

// Patterns de détection des emails
const EMAIL_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  /[a-zA-Z0-9._%+-]+\s*[@at]\s*[a-zA-Z0-9.-]+\s*[.dot]\s*[a-zA-Z]{2,}/gi,
  /[a-zA-Z0-9._%+-]+\s*arobase\s*[a-zA-Z0-9.-]+/gi,
];

// Patterns WhatsApp / Telegram / Réseaux sociaux
const SOCIAL_PATTERNS = [
  /whatsapp/gi,
  /telegram/gi,
  /signal/gi,
  /viber/gi,
  /facebook/gi,
  /instagram/gi,
  /snapchat/gi,
  /tiktok/gi,
  /twitter/gi,
  /mon\s*numéro/gi,
  /mon\s*numero/gi,
  /appelle[z]?\s*moi/gi,
  /appel[e]?\s*moi/gi,
  /contacte[z]?\s*moi/gi,
  /envoie[z]?\s*moi/gi,
  /écris?\s*moi/gi,
  /joignable/gi,
];

// Patterns de paiement externe
const PAYMENT_PATTERNS = [
  /paiement\s*(?:en\s*)?(?:espèces?|cash|liquide)/gi,
  /virement\s*(?:direct|bancaire)/gi,
  /mobile\s*money/gi,
  /airtel\s*money/gi,
  /moov\s*money/gi,
  /orange\s*money/gi,
  /mtn\s*money/gi,
  /wave/gi,
  /payer?\s*(?:en\s*)?dehors/gi,
  /hors\s*(?:de\s*la\s*)?plateforme/gi,
  /sans\s*passer\s*par/gi,
  /directement/gi,
  /en\s*main\s*propre/gi,
];

// Patterns de rencontre externe
const MEET_PATTERNS = [
  /on\s*se\s*voit/gi,
  /rendez[\s-]?vous/gi,
  /rdv/gi,
  /retrouv(?:er|ons)/gi,
  /passe[z]?\s*(?:me\s*)?voir/gi,
  /vien[st]?\s*(?:me\s*)?voir/gi,
  /mon\s*adresse/gi,
  /chez\s*moi/gi,
];

/**
 * Analyse un message et détecte les tentatives de fraude
 * @param {string} content - Le contenu du message
 * @returns {Object} - Résultat de l'analyse
 */
export function analyzeMessage(content) {
  const result = {
    isSuspicious: false,
    detectedPatterns: [],
    filteredContent: content,
    alertType: null,
    severity: 'LOW',
  };

  if (!content || typeof content !== 'string') {
    return result;
  }

  const lowerContent = content.toLowerCase();

  // Vérifier les numéros de téléphone
  for (const pattern of PHONE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Filtrer les faux positifs (années, prix, etc.)
      const validMatches = matches.filter(m => {
        const digits = m.replace(/\D/g, '');
        return digits.length >= 8 && digits.length <= 15;
      });
      
      if (validMatches.length > 0) {
        result.isSuspicious = true;
        result.detectedPatterns.push({
          type: 'PHONE_NUMBER',
          matches: validMatches,
        });
        result.alertType = 'PHONE_NUMBER';
        result.severity = 'HIGH';
        
        // Masquer les numéros dans le contenu
        validMatches.forEach(match => {
          result.filteredContent = result.filteredContent.replace(
            match,
            '[NUMÉRO MASQUÉ]'
          );
        });
      }
    }
  }

  // Vérifier les emails
  for (const pattern of EMAIL_PATTERNS) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      result.isSuspicious = true;
      result.detectedPatterns.push({
        type: 'EMAIL',
        matches: matches,
      });
      if (!result.alertType) result.alertType = 'EMAIL';
      result.severity = 'HIGH';
      
      matches.forEach(match => {
        result.filteredContent = result.filteredContent.replace(
          match,
          '[EMAIL MASQUÉ]'
        );
      });
    }
  }

  // Vérifier les réseaux sociaux
  for (const pattern of SOCIAL_PATTERNS) {
    if (pattern.test(lowerContent)) {
      result.isSuspicious = true;
      result.detectedPatterns.push({
        type: 'SOCIAL_MEDIA',
        pattern: pattern.source,
      });
      if (!result.alertType) result.alertType = 'WHATSAPP';
      if (result.severity === 'LOW') result.severity = 'MEDIUM';
    }
  }

  // Vérifier les paiements externes
  for (const pattern of PAYMENT_PATTERNS) {
    if (pattern.test(lowerContent)) {
      result.isSuspicious = true;
      result.detectedPatterns.push({
        type: 'EXTERNAL_PAYMENT',
        pattern: pattern.source,
      });
      if (!result.alertType) result.alertType = 'EXTERNAL_PAYMENT';
      result.severity = 'CRITICAL';
    }
  }

  // Vérifier les tentatives de rencontre externe
  for (const pattern of MEET_PATTERNS) {
    if (pattern.test(lowerContent)) {
      result.detectedPatterns.push({
        type: 'MEET_OUTSIDE',
        pattern: pattern.source,
      });
      // Ne pas marquer comme suspect seul, mais augmenter si déjà suspect
      if (result.isSuspicious) {
        if (!result.alertType) result.alertType = 'MEET_OUTSIDE';
      }
    }
  }

  return result;
}

/**
 * Détermine le niveau de risque d'un utilisateur basé sur ses alertes
 * @param {number} alertCount - Nombre d'alertes
 * @returns {string} - Niveau de risque
 */
export function calculateRiskLevel(alertCount) {
  if (alertCount === 0) return 'NONE';
  if (alertCount <= 2) return 'LOW';
  if (alertCount <= 5) return 'MEDIUM';
  if (alertCount <= 10) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Génère un message d'avertissement pour l'utilisateur
 * @param {string} alertType - Type d'alerte
 * @returns {string} - Message d'avertissement
 */
export function getWarningMessage(alertType) {
  const messages = {
    PHONE_NUMBER: "⚠️ L'envoi de numéros de téléphone n'est pas autorisé. Toutes les communications doivent passer par la messagerie KAPUCE.G pour votre sécurité.",
    EMAIL: "⚠️ L'envoi d'adresses email n'est pas autorisé. Utilisez la messagerie KAPUCE.G pour communiquer en toute sécurité.",
    WHATSAPP: "⚠️ Les références aux applications de messagerie externes ne sont pas autorisées. KAPUCE.G assure la sécurité de vos échanges.",
    TELEGRAM: "⚠️ Les références aux applications de messagerie externes ne sont pas autorisées. KAPUCE.G assure la sécurité de vos échanges.",
    EXTERNAL_PAYMENT: "⚠️ Les propositions de paiement en dehors de KAPUCE.G ne sont pas autorisées. Le système de paiement sécurisé protège vos transactions.",
    MEET_OUTSIDE: "⚠️ Pour votre sécurité, toutes les transactions doivent être effectuées via KAPUCE.G.",
    OTHER: "⚠️ Ce message a été filtré car il contient des informations non autorisées sur la plateforme.",
  };

  return messages[alertType] || messages.OTHER;
}

export default {
  analyzeMessage,
  calculateRiskLevel,
  getWarningMessage,
};
