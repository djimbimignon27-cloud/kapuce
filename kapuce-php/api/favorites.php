<?php
/**
 * API Favoris - KAPUCE.G
 * POST {listing_id} : ajoute/retire des favoris (toggle)
 */
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

$user = current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non autorisé']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$listingId = $body['listing_id'] ?? '';

$pdo = db();
$stmt = $pdo->prepare('SELECT COUNT(*) FROM listings WHERE id = ?');
$stmt->execute([$listingId]);
if (!$stmt->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Annonce introuvable']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?');
$stmt->execute([$user['id'], $listingId]);
$fav = $stmt->fetch();

if ($fav) {
    $pdo->prepare('DELETE FROM favorites WHERE id = ?')->execute([$fav['id']]);
    echo json_encode(['success' => true, 'favorited' => false]);
} else {
    $pdo->prepare('INSERT INTO favorites (id, user_id, listing_id) VALUES (?, ?, ?)')->execute([uuid(), $user['id'], $listingId]);
    echo json_encode(['success' => true, 'favorited' => true]);
}
