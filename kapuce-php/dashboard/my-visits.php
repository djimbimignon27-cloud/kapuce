<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

$stmt = db()->prepare('SELECT vr.*, l.title AS listing_title, l.id AS lid, u.full_name AS owner_name FROM visit_requests vr JOIN listings l ON l.id = vr.listing_id JOIN users u ON u.id = vr.owner_id WHERE vr.requester_id = ? ORDER BY vr.created_at DESC');
$stmt->execute([$user['id']]);
$visits = $stmt->fetchAll();

$pageTitle = 'Mes demandes de visite';
require_once __DIR__ . '/../includes/header.php';
$statusColors = ['PENDING' => 'bg-amber-100 text-amber-700', 'ACCEPTED' => 'bg-green-100 text-green-700', 'REJECTED' => 'bg-red-100 text-red-700', 'COMPLETED' => 'bg-blue-100 text-blue-700'];
?>
<div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6">Mes demandes de visite</h1>
    <?php if (!$visits): ?>
        <div class="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500">
            Vous n'avez pas encore fait de demande de visite.<br>
            <a href="/listings.php" class="text-brand-600 font-semibold">Explorer les annonces →</a>
        </div>
    <?php else: ?>
    <div class="space-y-4">
        <?php foreach ($visits as $v): ?>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $statusColors[$v['status']] ?>"><?= visit_status_label($v['status']) ?></span>
                    <span class="text-xs text-gray-400"><?= time_ago($v['created_at']) ?></span>
                </div>
                <a href="/listing.php?id=<?= h($v['lid']) ?>" class="font-bold text-gray-900 hover:text-brand-600"><?= h($v['listing_title']) ?></a>
                <p class="text-sm text-gray-500">Propriétaire : <?= h($v['owner_name']) ?></p>
            </div>
            <div class="flex gap-2">
                <?php if ($v['status'] === 'ACCEPTED'): ?>
                    <a href="/messages.php" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold text-sm">💬 Discuter</a>
                    <a href="/listing.php?id=<?= h($v['lid']) ?>" class="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm">💰 Payer</a>
                <?php elseif ($v['status'] === 'PENDING'): ?>
                    <span class="text-sm text-gray-400">En attente du propriétaire...</span>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
