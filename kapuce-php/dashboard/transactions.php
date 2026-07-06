<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

$stmt = db()->prepare('SELECT t.*, l.title AS listing_title, ub.full_name AS buyer_name, us.full_name AS seller_name FROM transactions t JOIN listings l ON l.id = t.listing_id JOIN users ub ON ub.id = t.buyer_id JOIN users us ON us.id = t.seller_id WHERE t.buyer_id = ? OR t.seller_id = ? ORDER BY t.created_at DESC');
$stmt->execute([$user['id'], $user['id']]);
$txs = $stmt->fetchAll();

// Avis déjà laissés par l'utilisateur (transaction_id => review)
$myReviews = [];
if ($txs) {
    $r = db()->prepare('SELECT transaction_id FROM reviews WHERE reviewer_id = ?');
    $r->execute([$user['id']]);
    foreach ($r->fetchAll() as $row) $myReviews[$row['transaction_id']] = true;
}

$pageTitle = 'Mes transactions';
require_once __DIR__ . '/../includes/header.php';
$statusColors = ['PENDING_PAYMENT' => 'bg-amber-100 text-amber-700', 'PAID' => 'bg-blue-100 text-blue-700', 'PROCESSING' => 'bg-purple-100 text-purple-700', 'COMPLETED' => 'bg-green-100 text-green-700', 'CANCELLED' => 'bg-gray-100 text-gray-600', 'REFUNDED' => 'bg-red-100 text-red-700', 'DISPUTED' => 'bg-red-100 text-red-700'];
?>
<div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6">Mes transactions</h1>
    <?php if (!$txs): ?>
        <div class="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500">Aucune transaction pour le moment.</div>
    <?php else: ?>
    <div class="space-y-4">
        <?php foreach ($txs as $t): $isBuyer = $t['buyer_id'] === $user['id']; ?>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex flex-col sm:flex-row justify-between gap-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $statusColors[$t['status']] ?? 'bg-gray-100' ?>"><?= tx_status_label($t['status']) ?></span>
                        <span class="text-xs text-gray-400"><?= $isBuyer ? '🛒 Achat' : '💵 Vente' ?> • <?= time_ago($t['created_at']) ?></span>
                    </div>
                    <h3 class="font-bold text-gray-900"><?= h($t['listing_title']) ?></h3>
                    <p class="text-sm text-gray-500"><?= $isBuyer ? 'Vendeur : ' . h($t['seller_name']) : 'Acheteur : ' . h($t['buyer_name']) ?></p>
                    <?php if ($t['payment_reference']): ?><p class="text-xs text-gray-400 mt-1">Réf : <?= h($t['payment_reference']) ?></p><?php endif; ?>
                </div>
                <div class="text-right">
                    <?php if ($isBuyer): ?>
                        <div class="text-xl font-extrabold text-gray-900"><?= format_price($t['total_paid_by_buyer']) ?></div>
                        <div class="text-xs text-gray-400">dont frais KAPUCE.G : <?= format_price($t['commission_client']) ?></div>
                        <?php if ($t['status'] === 'PENDING_PAYMENT'): ?>
                            <a href="/pay.php?id=<?= h($t['id']) ?>" class="inline-block mt-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold text-sm">Payer maintenant</a>
                        <?php endif; ?>
                    <?php else: ?>
                        <div class="text-xl font-extrabold text-brand-600"><?= format_price($t['seller_receives']) ?></div>
                        <div class="text-xs text-gray-400">après commission KAPUCE.G (<?= h($t['commission_rate_owner']) ?>%)</div>
                        <?php if ($t['status'] === 'PAID'): ?><div class="text-xs text-blue-600 font-medium mt-1">🔒 Fonds en séquestre chez KAPUCE.G</div><?php endif; ?>
                    <?php endif; ?>
                    <?php if ($t['status'] === 'COMPLETED'): ?>
                        <?php if (empty($myReviews[$t['id']])): ?>
                            <a href="/review.php?tx=<?= h($t['id']) ?>" class="inline-block mt-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm">⭐ Noter <?= $isBuyer ? 'le propriétaire' : 'le client' ?></a>
                        <?php else: ?>
                            <div class="text-xs text-amber-600 font-medium mt-2">⭐ Avis publié — merci !</div>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
