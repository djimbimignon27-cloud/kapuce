<?php
require_once __DIR__ . '/functions.php';

function current_user() {
    static $user = false;
    if ($user !== false) return $user;
    if (empty($_SESSION['user_id'])) {
        $user = null;
        return null;
    }
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch() ?: null;
    if ($user && $user['is_banned']) {
        session_destroy();
        $user = null;
    }
    return $user;
}

function is_logged_in() {
    return current_user() !== null;
}

function is_admin($user = null) {
    $user = $user ?: current_user();
    return $user && in_array($user['role'], ['ADMIN', 'SUPER_ADMIN', 'ADMIN_MODERATOR', 'ADMIN_FINANCE']);
}

function require_login() {
    if (!is_logged_in()) {
        flash('Veuillez vous connecter pour continuer.', 'error');
        redirect('/login.php');
    }
    return current_user();
}

function require_admin() {
    $user = current_user();
    if (!$user || !is_admin($user)) {
        redirect('/admin/login.php');
    }
    return $user;
}

function csrf_token() {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function check_csrf() {
    if (($_POST['csrf'] ?? '') !== ($_SESSION['csrf'] ?? null)) {
        die('Erreur de sécurité (CSRF). Rechargez la page et réessayez.');
    }
}
