import connectDB from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service de notifications pour KAMA
 * Gère la création et l'envoi de notifications aux utilisateurs
 */

// Templates de notifications
const NOTIFICATION_TEMPLATES = {
  LISTING_APPROVED: {
    title: '✅ Annonce approuvée',
    getMessage: (data) => `Votre annonce "${data.listingTitle}" a été approuvée et est maintenant visible.`,
    priority: 'HIGH',
  },
  LISTING_REJECTED: {
    title: '❌ Annonce rejetée',
    getMessage: (data) => `Votre annonce "${data.listingTitle}" a été rejetée. Raison: ${data.reason || 'Non conforme aux conditions'}`,
    priority: 'HIGH',
  },
  TRANSACTION_INITIATED: {
    title: '💰 Nouvelle transaction',
    getMessage: (data) => `Une transaction de ${data.amount?.toLocaleString('fr-FR')} FCFA a été initiée pour "${data.listingTitle}".`,
    priority: 'URGENT',
  },
  TRANSACTION_COMPLETED: {
    title: '🎉 Transaction complétée',
    getMessage: (data) => `La transaction pour "${data.listingTitle}" a été finalisée avec succès.`,
    priority: 'HIGH',
  },
  PAYMENT_RECEIVED: {
    title: '💵 Paiement reçu',
    getMessage: (data) => `Vous avez reçu un paiement de ${data.amount?.toLocaleString('fr-FR')} FCFA.`,
    priority: 'HIGH',
  },
  COMMISSION_CHARGED: {
    title: '📊 Commission prélevée',
    getMessage: (data) => `Une commission de ${data.amount?.toLocaleString('fr-FR')} FCFA (${data.rate}%) a été prélevée sur votre transaction.`,
    priority: 'MEDIUM',
  },
  ACCOUNT_VERIFIED: {
    title: '✅ Compte vérifié',
    getMessage: () => 'Félicitations ! Votre compte a été vérifié. Vous avez maintenant accès à toutes les fonctionnalités.',
    priority: 'HIGH',
  },
  ACCOUNT_BANNED: {
    title: '⛔ Compte suspendu',
    getMessage: (data) => `Votre compte a été suspendu. Raison: ${data.reason || 'Violation des conditions d\'utilisation'}`,
    priority: 'URGENT',
  },
  NEW_FAVORITE: {
    title: '❤️ Nouveau favori',
    getMessage: (data) => `Quelqu'un a ajouté votre annonce "${data.listingTitle}" à ses favoris.`,
    priority: 'LOW',
  },
  PRICE_DROP: {
    title: '📉 Baisse de prix',
    getMessage: (data) => `Le prix de "${data.listingTitle}" a baissé de ${data.oldPrice?.toLocaleString('fr-FR')} à ${data.newPrice?.toLocaleString('fr-FR')} FCFA.`,
    priority: 'MEDIUM',
  },
  SYSTEM: {
    title: '📢 Information',
    getMessage: (data) => data.message || 'Notification système',
    priority: 'LOW',
  },
};

/**
 * Créer une notification pour un utilisateur
 */
export async function createNotification({
  userId,
  type,
  data = {},
  customTitle,
  customMessage,
  actionUrl,
}) {
  try {
    await connectDB();

    const template = NOTIFICATION_TEMPLATES[type];
    if (!template && !customTitle) {
      throw new Error(`Type de notification inconnu: ${type}`);
    }

    const notification = new Notification({
      _id: uuidv4(),
      userId,
      type,
      title: customTitle || template.title,
      message: customMessage || template.getMessage(data),
      data,
      priority: template?.priority || 'MEDIUM',
      actionUrl,
      relatedId: data.listingId || data.transactionId || data.userId,
      relatedType: data.listingId ? 'LISTING' : data.transactionId ? 'TRANSACTION' : data.userId ? 'USER' : null,
    });

    await notification.save();
    
    console.log(`🔔 Notification créée pour ${userId}: ${notification.title}`);
    
    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    throw error;
  }
}

/**
 * Créer des notifications pour plusieurs utilisateurs
 */
export async function createBulkNotifications(notifications) {
  try {
    await connectDB();
    
    const notificationsToCreate = notifications.map(n => {
      const template = NOTIFICATION_TEMPLATES[n.type];
      return {
        _id: uuidv4(),
        userId: n.userId,
        type: n.type,
        title: n.customTitle || template?.title || 'Notification',
        message: n.customMessage || template?.getMessage(n.data) || '',
        data: n.data || {},
        priority: template?.priority || 'MEDIUM',
        actionUrl: n.actionUrl,
        relatedId: n.data?.listingId || n.data?.transactionId,
        relatedType: n.data?.listingId ? 'LISTING' : n.data?.transactionId ? 'TRANSACTION' : null,
      };
    });

    await Notification.insertMany(notificationsToCreate);
    
    console.log(`🔔 ${notificationsToCreate.length} notifications créées`);
    
    return notificationsToCreate;
  } catch (error) {
    console.error('Erreur création notifications en masse:', error);
    throw error;
  }
}

/**
 * Notifier l'approbation d'une annonce
 */
export async function notifyListingApproved(userId, listingId, listingTitle) {
  return createNotification({
    userId,
    type: 'LISTING_APPROVED',
    data: { listingId, listingTitle },
    actionUrl: `/listings/${listingId}`,
  });
}

/**
 * Notifier le rejet d'une annonce
 */
export async function notifyListingRejected(userId, listingId, listingTitle, reason) {
  return createNotification({
    userId,
    type: 'LISTING_REJECTED',
    data: { listingId, listingTitle, reason },
    actionUrl: `/dashboard/listings`,
  });
}

/**
 * Notifier une nouvelle transaction
 */
export async function notifyTransactionInitiated(userId, transactionId, listingTitle, amount) {
  return createNotification({
    userId,
    type: 'TRANSACTION_INITIATED',
    data: { transactionId, listingTitle, amount },
    actionUrl: `/dashboard/transactions/${transactionId}`,
  });
}

/**
 * Notifier un paiement reçu
 */
export async function notifyPaymentReceived(userId, amount, transactionId) {
  return createNotification({
    userId,
    type: 'PAYMENT_RECEIVED',
    data: { amount, transactionId },
    actionUrl: `/dashboard/payments`,
  });
}

/**
 * Notifier une commission prélevée
 */
export async function notifyCommissionCharged(userId, amount, rate, transactionId) {
  return createNotification({
    userId,
    type: 'COMMISSION_CHARGED',
    data: { amount, rate, transactionId },
    actionUrl: `/dashboard/transactions/${transactionId}`,
  });
}

/**
 * Notifier le bannissement d'un compte
 */
export async function notifyAccountBanned(userId, reason) {
  return createNotification({
    userId,
    type: 'ACCOUNT_BANNED',
    data: { reason },
  });
}

/**
 * Récupérer le nombre de notifications non lues
 */
export async function getUnreadCount(userId) {
  await connectDB();
  return Notification.countDocuments({ userId, read: false });
}

export default {
  createNotification,
  createBulkNotifications,
  notifyListingApproved,
  notifyListingRejected,
  notifyTransactionInitiated,
  notifyPaymentReceived,
  notifyCommissionCharged,
  notifyAccountBanned,
  getUnreadCount,
};
