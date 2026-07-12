<?php
/**
 * API Notifications - KAPUCE.G
 * GET : liste des 20 dernières notifications + compteur non-lues
 * POST {action: 'mark_read'} : tout marquer comme lu
 */
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

$user = current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non autorisé']);
    exit;
}

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT id, type, title, message, link, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
    $stmt->execute([$user['id']]);
    $notifications = $stmt->fetchAll();
    foreach ($notifications as &$n) {
        $n['time'] = time_ago($n['created_at']);
    }
    unset($n);
    echo json_encode(['success' => true, 'count' => unread_notifications_count($user['id']), 'notifications' => $notifications]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    if (($body['action'] ?? '') === 'mark_read') {
        $pdo->prepare('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL')->execute([$user['id']]);
        echo json_encode(['success' => true]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Action inconnue']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
