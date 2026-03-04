import { NextResponse } from 'next/server';
import AdminLog from '@/lib/models/AdminLog';

// Helper pour logger les actions admin
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId = null,
  details = '',
  request,
}) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await AdminLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
    });

    console.log(`📝 [ADMIN LOG] ${action} by ${adminId} on ${targetType} ${targetId || ''}`);
  } catch (error) {
    console.error('Erreur lors du log admin:', error);
  }
}

// Middleware pour vérifier les permissions admin
export function checkAdminPermission(allowedRoles) {
  return (auth) => {
    if (!auth.authenticated) {
      return { authorized: false, error: 'Non authentifié' };
    }

    if (!allowedRoles.includes(auth.role)) {
      return { authorized: false, error: 'Permissions insuffisantes' };
    }

    return { authorized: true };
  };
}

// Définition des permissions par rôle
export const AdminPermissions = {
  SUPER_ADMIN: [
    'manage_admins',
    'view_all_dashboards',
    'change_settings',
    'view_financial_reports',
    'approve_listings',
    'manage_users',
    'handle_reports',
    'view_transactions',
    'export_data',
  ],
  ADMIN_MODERATOR: [
    'approve_listings',
    'manage_users',
    'handle_reports',
    'verify_identities',
  ],
  ADMIN_FINANCE: [
    'view_transactions',
    'view_financial_reports',
    'export_data',
    'view_commissions',
  ],
};

export function hasPermission(role, permission) {
  return AdminPermissions[role]?.includes(permission) || false;
}
