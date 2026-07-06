<?php
/**
 * API AJAX Messagerie - KAPUCE.G
 * GET  ?conversation_id=xxx  : messages d'une conversation (+ marquage lu)
 * POST {conversation_id, content} : envoi d'un message (filtrage anti-fraude)
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

function user_in_conversation($pdo, $convId, $userId) {
    $stmt = $pdo->prepare('SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)');
    $stmt->execute([$convId, $userId, $userId]);
    return $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $convId = $_GET['conversation_id'] ?? '';
    $conv = user_in_conversation($pdo, $convId, $user['id']);
    if (!$conv) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Conversation introuvable']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, sender_id, receiver_id, content, is_filtered, is_system, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 200');
    $stmt->execute([$convId]);
    $messages = $stmt->fetchAll();
    foreach ($messages as &$m) {
        $m['time'] = date('H:i', strtotime($m['created_at']));
    }
    unset($m);
    // Marquer comme lus
    $pdo->prepare('UPDATE messages SET read_at = NOW() WHERE conversation_id = ? AND receiver_id = ? AND read_at IS NULL')->execute([$convId, $user['id']]);
    echo json_encode(['success' => true, 'messages' => $messages]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $convId = $body['conversation_id'] ?? '';
    $content = trim($body['content'] ?? '');
    if (!$content || mb_strlen($content) > 2000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Message vide ou trop long']);
        exit;
    }
    $conv = user_in_conversation($pdo, $convId, $user['id']);
    if (!$conv) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Conversation introuvable']);
        exit;
    }
    $receiverId = $conv['participant1_id'] === $user['id'] ? $conv['participant2_id'] : $conv['participant1_id'];
    $msg = send_message($convId, $user['id'], $receiverId, $content);
    echo json_encode([
        'success' => true,
        'message' => $msg,
        'warning' => $msg['is_filtered'] ? get_warning_message($msg['filter_reason']) : null,
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
