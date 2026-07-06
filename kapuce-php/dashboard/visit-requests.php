<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

// Accepter / Refuser une demande
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $vrId = $_POST['visit_id'] ?? '';
    $action = $_POST['action'] ?? '';
    $stmt = db()->prepare("SELECT vr.*, l.title AS listing_title FROM visit_requests vr JOIN listings l ON l.id = vr.listing_id WHERE vr.id = ? AND vr.owner_id = ? AND vr.status = 'PENDING'");
    $stmt->execute([$vrId, $user['id']]);
    $vr = $stmt->fetch();
    if ($vr) {
        if ($action === 'accept') {
            db()->prepare("UPDATE visit_requests SET status = 'ACCEPTED', accepted_at = NOW() WHERE id = ?")->execute([$vrId]);
            // Créer la conversation + message système
            $conv = get_or_create_conversation($vr['requester_id'], $user['id'], $vr['listing_id'], $vr['listing_title']);
            send_message($conv['id'], 'SYSTEM', $vr['requester_id'], "✅ Votre demande de visite pour \"" . $vr['listing_title'] . "\" a été acceptée ! Discutez ici avec le propriétaire pour fixer la date et l'heure du rendez-vous. Rappel : toute communication et tout paiement doivent passer par KAPUCE.G.", true);
            flash('✅ Visite acceptée. Une conversation sécurisée a été ouverte avec le client.');
        } elseif ($action === 'reject') {
            db()->prepare("UPDATE visit_requests SET status = 'REJECTED', rejected_at = NOW() WHERE id = ?")->execute([$vrId]);
            flash('Demande de visite refusée.');
        }
    }
    redirect('/dashboard/visit-requests.php');
}

$stmt = db()->prepare('SELECT vr.*, l.title AS listing_title, l.price AS listing_price, l.images AS images, u.full_name AS requester_name FROM visit_requests vr JOIN listings l ON l.id = vr.listing_id JOIN users u ON u.id = vr.requester_id WHERE vr.owner_id = ? ORDER BY FIELD(vr.status, \'PENDING\') DESC, vr.created_at DESC');
$stmt->execute([$user['id']]);
$requests = $stmt->fetchAll();

$pageTitle = 'Demandes de visite reçues';
require_once __DIR__ . '/../includes/header.php';
$statusColors = ['PENDING' => 'bg-amber-100 text-amber-700', 'ACCEPTED' => 'bg-green-100 text-green-700', 'REJECTED' => 'bg-red-100 text-red-700', 'COMPLETED' => 'bg-blue-100 text-blue-700'];
?>
<div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6">Demandes de visite reçues</h1>
    <?php if (!$requests): ?>
        <div class="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500">Aucune demande de visite pour le moment.</div>
    <?php else: ?>
    <div class="space-y-4">
        <?php foreach ($requests as $r): ?>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $statusColors[$r['status']] ?>"><?= visit_status_label($r['status']) ?></span>
                        <span class="text-xs text-gray-400"><?= time_ago($r['created_at']) ?></span>
                    </div>
                    <h3 class="font-bold text-gray-900"><?= h($r['listing_title']) ?></h3>
                    <p class="text-sm text-gray-500">Demandé par <strong><?= h($r['requester_name']) ?></strong></p>
                    <?php if ($r['proposed_date']): ?><p class="text-sm text-gray-500">📅 Date souhaitée : <?= date('d/m/Y H:i', strtotime($r['proposed_date'])) ?></p><?php endif; ?>
                    <?php if ($r['message']): ?><p class="text-sm text-gray-600 mt-1 italic">« <?= h($r['message']) ?> »</p><?php endif; ?>
                </div>
                <?php if ($r['status'] === 'PENDING'): ?>
                <div class="flex gap-2">
                    <form method="post">
                        <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                        <input type="hidden" name="visit_id" value="<?= h($r['id']) ?>">
                        <input type="hidden" name="action" value="accept">
                        <button class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg font-bold text-sm">✓ Accepter</button>
                    </form>
                    <form method="post">
                        <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                        <input type="hidden" name="visit_id" value="<?= h($r['id']) ?>">
                        <input type="hidden" name="action" value="reject">
                        <button class="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2 rounded-lg font-bold text-sm">✗ Refuser</button>
                    </form>
                </div>
                <?php elseif ($r['status'] === 'ACCEPTED'): ?>
                <a href="/messages.php" class="bg-gray-900 text-white px-5 py-2 rounded-lg font-bold text-sm text-center">💬 Messagerie</a>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
