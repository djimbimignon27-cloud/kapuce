<?php
/**
 * Contacter le support KAPUCE.G
 * Ouvre (ou crée) la conversation sécurisée entre l'utilisateur et l'équipe KAPUCE.G
 */
require_once __DIR__ . '/includes/auth.php';
$user = require_login();

if (is_admin($user)) {
    flash('Vous êtes administrateur : contactez les utilisateurs depuis le panel admin.', 'error');
    redirect('/admin/users.php');
}

$conv = get_support_conversation($user['id']);
if (!$conv) {
    flash('Le support est momentanément indisponible. Réessayez plus tard.', 'error');
    redirect('/messages.php');
}
redirect('/messages.php?c=' . $conv['id']);
