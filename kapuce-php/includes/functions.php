<?php
require_once __DIR__ . '/db.php';

function uuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function h($s) {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

function format_price($n) {
    return number_format((float)$n, 0, ',', ' ') . ' FCFA';
}

function time_ago($datetime) {
    if (!$datetime) return '';
    $ts = is_numeric($datetime) ? $datetime : strtotime($datetime);
    $diff = time() - $ts;
    if ($diff < 60) return 'à l\'instant';
    if ($diff < 3600) return floor($diff / 60) . ' min';
    if ($diff < 86400) return floor($diff / 3600) . ' h';
    if ($diff < 2592000) return floor($diff / 86400) . ' j';
    return date('d/m/Y', $ts);
}

function flash($msg = null, $type = 'success') {
    if ($msg !== null) {
        $_SESSION['flash'] = ['msg' => $msg, 'type' => $type];
        return;
    }
    if (!empty($_SESSION['flash'])) {
        $f = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $f;
    }
    return null;
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function get_settings() {
    $row = db()->query("SELECT * FROM settings WHERE id = 'global'")->fetch();
    if (!$row) {
        return ['commission_client' => DEFAULT_COMMISSION_CLIENT, 'commission_owner' => DEFAULT_COMMISSION_OWNER];
    }
    return $row;
}

// ============================================================
// SYSTÈME ANTI-FRAUDE KAPUCE.G
// Détecte numéros de téléphone, emails, réseaux sociaux,
// paiements externes. Masque le contenu sensible.
// ============================================================
function analyze_message($content) {
    $result = [
        'is_suspicious' => false,
        'detected' => [],
        'filtered_content' => $content,
        'alert_type' => null,
        'severity' => 'LOW',
    ];
    if (!$content) return $result;
    $lower = mb_strtolower($content);

    // --- Numéros de téléphone ---
    $phone_patterns = [
        '/(?:\+?241|00241)?[\s.\-]?(?:0?[1-9])[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}/',
        '/(?:\+|00)?\d{1,3}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}/',
        '/\d[\s.\-]?\d[\s.\-]?\d[\s.\-]?\d[\s.\-]?\d[\s.\-]?\d[\s.\-]?\d[\s.\-]?\d/',
    ];
    foreach ($phone_patterns as $p) {
        if (preg_match_all($p, $content, $m)) {
            $valid = array_filter($m[0], function ($x) {
                $digits = preg_replace('/\D/', '', $x);
                return strlen($digits) >= 8 && strlen($digits) <= 15;
            });
            if ($valid) {
                $result['is_suspicious'] = true;
                $result['detected'][] = ['type' => 'PHONE_NUMBER', 'matches' => array_values($valid)];
                $result['alert_type'] = 'PHONE_NUMBER';
                $result['severity'] = 'HIGH';
                foreach ($valid as $match) {
                    $result['filtered_content'] = str_replace($match, '[NUMÉRO MASQUÉ]', $result['filtered_content']);
                }
            }
        }
    }

    // --- Emails ---
    if (preg_match_all('/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/', $content, $m) ||
        preg_match_all('/[a-zA-Z0-9._%+\-]+\s*arobase\s*[a-zA-Z0-9.\-]+/i', $content, $m)) {
        if (!empty($m[0])) {
            $result['is_suspicious'] = true;
            $result['detected'][] = ['type' => 'EMAIL', 'matches' => $m[0]];
            if (!$result['alert_type']) $result['alert_type'] = 'EMAIL';
            $result['severity'] = 'HIGH';
            foreach ($m[0] as $match) {
                $result['filtered_content'] = str_replace($match, '[EMAIL MASQUÉ]', $result['filtered_content']);
            }
        }
    }

    // --- Réseaux sociaux / contact externe ---
    $social = ['whatsapp', 'telegram', 'signal', 'viber', 'facebook', 'instagram', 'snapchat', 'tiktok',
        'mon numéro', 'mon numero', 'appelle moi', 'appellez moi', 'appelez moi', 'contacte moi', 'contactez moi',
        'envoie moi', 'envoiez moi', 'écris moi', 'ecris moi', 'joignable'];
    foreach ($social as $word) {
        if (mb_strpos($lower, $word) !== false) {
            $result['is_suspicious'] = true;
            $result['detected'][] = ['type' => 'SOCIAL_MEDIA', 'pattern' => $word];
            if (!$result['alert_type']) $result['alert_type'] = 'WHATSAPP';
            if ($result['severity'] === 'LOW') $result['severity'] = 'MEDIUM';
        }
    }

    // --- Paiement externe ---
    $payment = ['paiement en espèces', 'paiement espèces', 'paiement cash', 'paiement liquide', 'en espèces',
        'virement direct', 'virement bancaire', 'payer dehors', 'payer en dehors', 'hors plateforme',
        'hors de la plateforme', 'sans passer par', 'directement', 'en main propre'];
    foreach ($payment as $word) {
        if (mb_strpos($lower, $word) !== false) {
            $result['is_suspicious'] = true;
            $result['detected'][] = ['type' => 'EXTERNAL_PAYMENT', 'pattern' => $word];
            if (!$result['alert_type']) $result['alert_type'] = 'EXTERNAL_PAYMENT';
            $result['severity'] = 'CRITICAL';
        }
    }

    return $result;
}

function calculate_risk_level($alertCount) {
    if ($alertCount == 0) return 'NONE';
    if ($alertCount <= 2) return 'LOW';
    if ($alertCount <= 5) return 'MEDIUM';
    if ($alertCount <= 10) return 'HIGH';
    return 'CRITICAL';
}

function get_warning_message($alertType) {
    $messages = [
        'PHONE_NUMBER' => "⚠️ L'envoi de numéros de téléphone n'est pas autorisé. Toutes les communications doivent passer par la messagerie KAPUCE.G pour votre sécurité.",
        'EMAIL' => "⚠️ L'envoi d'adresses email n'est pas autorisé. Utilisez la messagerie KAPUCE.G pour communiquer en toute sécurité.",
        'WHATSAPP' => "⚠️ Les références aux applications de messagerie externes ne sont pas autorisées. KAPUCE.G assure la sécurité de vos échanges.",
        'EXTERNAL_PAYMENT' => "⚠️ Les propositions de paiement en dehors de KAPUCE.G ne sont pas autorisées. Le système de paiement sécurisé protège vos transactions.",
        'OTHER' => "⚠️ Ce message a été filtré car il contient des informations non autorisées sur la plateforme.",
    ];
    return $messages[$alertType] ?? $messages['OTHER'];
}

// Crée une alerte fraude + met à jour le profil de risque de l'utilisateur
function create_fraud_alert($userId, $messageId, $conversationId, $alertType, $severity, $detectedContent) {
    $pdo = db();
    $stmt = $pdo->prepare("INSERT INTO fraud_alerts (id, user_id, message_id, conversation_id, alert_type, severity, detected_content, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())");
    $stmt->execute([uuid(), $userId, $messageId, $conversationId, $alertType, $severity, $detectedContent]);

    $pdo->prepare('UPDATE users SET fraud_alert_count = fraud_alert_count + 1, last_fraud_alert_at = NOW() WHERE id = ?')->execute([$userId]);
    $count = $pdo->prepare('SELECT fraud_alert_count FROM users WHERE id = ?');
    $count->execute([$userId]);
    $c = (int)$count->fetchColumn();
    $pdo->prepare('UPDATE users SET fraud_risk_level = ? WHERE id = ?')->execute([calculate_risk_level($c), $userId]);
}

// ID de l'admin support KAPUCE.G (SUPER_ADMIN en priorité)
function get_support_admin_id() {
    $id = db()->query("SELECT id FROM users WHERE role = 'SUPER_ADMIN' AND is_banned = 0 ORDER BY created_at ASC LIMIT 1")->fetchColumn();
    if (!$id) {
        $id = db()->query("SELECT id FROM users WHERE role IN ('ADMIN','ADMIN_MODERATOR','ADMIN_FINANCE') AND is_banned = 0 ORDER BY created_at ASC LIMIT 1")->fetchColumn();
    }
    return $id ?: null;
}

// Récupère ou crée la conversation Support KAPUCE.G d'un utilisateur
function get_support_conversation($userId) {
    $adminId = get_support_admin_id();
    if (!$adminId || $adminId === $userId) return null;
    $conv = get_or_create_conversation($userId, $adminId, null, 'Support KAPUCE.G');
    // Message de bienvenue si conversation vide
    $count = db()->prepare('SELECT COUNT(*) FROM messages WHERE conversation_id = ?');
    $count->execute([$conv['id']]);
    if (!(int)$count->fetchColumn()) {
        send_message($conv['id'], 'SYSTEM', $userId, "👋 Bienvenue sur le support KAPUCE.G ! Écrivez-nous ici pour toute question. C'est également ici que vous devez envoyer la CAPTURE D'ÉCRAN de vos paiements Mobile Money (Airtel : " . CONTACT_AIRTEL . " / Moov : " . CONTACT_MOOV . ") pour validation de vos transactions.", true);
    }
    return $conv;
}

// Récupère ou crée une conversation entre 2 utilisateurs pour une annonce
function get_or_create_conversation($user1, $user2, $listingId = null, $listingTitle = null) {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM conversations WHERE ((participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?)) AND (listing_id = ? OR (listing_id IS NULL AND ? IS NULL)) LIMIT 1');
    $stmt->execute([$user1, $user2, $user2, $user1, $listingId, $listingId]);
    $conv = $stmt->fetch();
    if ($conv) return $conv;

    $id = uuid();
    $pdo->prepare('INSERT INTO conversations (id, participant1_id, participant2_id, listing_id, listing_title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())')
        ->execute([$id, $user1, $user2, $listingId, $listingTitle]);
    $stmt = $pdo->prepare('SELECT * FROM conversations WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

// Envoie un message (avec filtrage anti-fraude). Retourne le message inséré.
function send_message($conversationId, $senderId, $receiverId, $content, $isSystem = false, $listingId = null, $imageUrl = null) {
    $pdo = db();
    $msgId = uuid();
    $isFiltered = 0;
    $filterReason = null;
    $original = null;
    $finalContent = $content;

    if (!$isSystem) {
        // Les administrateurs ne sont pas soumis au filtre anti-fraude
        $roleStmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
        $roleStmt->execute([$senderId]);
        $senderRole = $roleStmt->fetchColumn();
        $senderIsAdmin = in_array($senderRole, ['ADMIN', 'SUPER_ADMIN', 'ADMIN_MODERATOR', 'ADMIN_FINANCE']);

        if (!$senderIsAdmin) {
            $analysis = analyze_message($content);
            if ($analysis['is_suspicious']) {
                $isFiltered = 1;
                $filterReason = $analysis['alert_type'];
                $original = $content;
                $finalContent = $analysis['filtered_content'];
                create_fraud_alert($senderId, $msgId, $conversationId, $analysis['alert_type'], $analysis['severity'], $content);
            }
        }
    }

    $pdo->prepare('INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, original_content, is_filtered, filter_reason, is_system, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())')
        ->execute([$msgId, $conversationId, $senderId, $receiverId, $finalContent, $original, $isFiltered, $filterReason, $isSystem ? 1 : 0, $imageUrl]);

    $pdo->prepare('UPDATE conversations SET last_message = ?, last_sender_id = ?, updated_at = NOW() WHERE id = ?')
        ->execute([mb_substr($imageUrl && !$finalContent ? '📷 Photo' : $finalContent, 0, 120), $senderId, $conversationId]);

    // Message d'avertissement système si filtré
    if ($isFiltered) {
        $warnId = uuid();
        $pdo->prepare('INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, is_system, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())')
            ->execute([$warnId, $conversationId, 'SYSTEM', $senderId, get_warning_message($filterReason)]);
    }

    return ['id' => $msgId, 'content' => $finalContent, 'is_filtered' => $isFiltered, 'filter_reason' => $filterReason];
}

function unread_messages_count($userId) {
    $stmt = db()->prepare('SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND read_at IS NULL AND is_system = 0');
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

// Libellés français
function type_label($t) {
    return ['HOUSE' => 'Immobilier', 'LAND' => 'Terrain', 'CAR' => 'Véhicule'][$t] ?? $t;
}
function category_label($c) {
    return ['RENT' => 'Location', 'SALE' => 'Vente'][$c] ?? $c;
}
function status_label($s) {
    return ['DRAFT' => 'Brouillon', 'PENDING' => 'En attente', 'ACTIVE' => 'Active', 'SOLD' => 'Vendu', 'RENTED' => 'Loué', 'SUSPENDED' => 'Suspendu', 'REJECTED' => 'Rejeté'][$s] ?? $s;
}
function tx_status_label($s) {
    return ['INITIATED' => 'Initiée', 'PENDING_PAYMENT' => 'En attente de paiement', 'PAID' => 'Payée (séquestre)', 'PROCESSING' => 'En traitement', 'COMPLETED' => 'Terminée', 'CANCELLED' => 'Annulée', 'REFUNDED' => 'Remboursée', 'DISPUTED' => 'Litige'][$s] ?? $s;
}
function visit_status_label($s) {
    return ['PENDING' => 'En attente', 'ACCEPTED' => 'Acceptée', 'REJECTED' => 'Refusée', 'COMPLETED' => 'Terminée'][$s] ?? $s;
}

function listing_first_image($listing) {
    $images = json_decode($listing['images'] ?? '[]', true) ?: [];
    if (!empty($images[0]['url'])) return $images[0]['url'];
    return 'https://res.cloudinary.com/demo/image/upload/w_600,h_400,c_fill/sample.jpg';
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function notify($userId, $type, $title, $message, $link = null) {
    db()->prepare('INSERT INTO notifications (id, user_id, type, title, message, link, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())')
        ->execute([uuid(), $userId, $type, $title, $message, $link]);
}

function unread_notifications_count($userId) {
    $stmt = db()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL');
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

// Note moyenne et nombre d'avis d'un utilisateur
function user_rating($userId) {
    $stmt = db()->prepare('SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS count FROM reviews WHERE reviewed_id = ?');
    $stmt->execute([$userId]);
    $r = $stmt->fetch();
    return ['avg' => round((float)$r['avg_rating'], 1), 'count' => (int)$r['count']];
}

// Affichage HTML des étoiles (ex: 4.2 -> ★★★★☆)
function stars_html($avg) {
    $full = (int)round($avg);
    return '<span class="text-amber-400">' . str_repeat('★', $full) . '</span><span class="text-gray-300">' . str_repeat('★', 5 - $full) . '</span>';
}
