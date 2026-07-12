<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/_header.php';

$pdo = db();
$stats = [
    'users' => $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
    'listings_pending' => $pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'PENDING'")->fetchColumn(),
    'listings_active' => $pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'ACTIVE'")->fetchColumn(),
    'tx_paid' => $pdo->query("SELECT COUNT(*) FROM transactions WHERE status = 'PAID'")->fetchColumn(),
    'fraud_new' => $pdo->query("SELECT COUNT(*) FROM fraud_alerts WHERE status = 'NEW'")->fetchColumn(),
    'commission_total' => $pdo->query("SELECT COALESCE(SUM(commission_client + commission_owner), 0) FROM transactions WHERE status = 'COMPLETED'")->fetchColumn(),
    'escrow' => $pdo->query("SELECT COALESCE(SUM(total_paid_by_buyer), 0) FROM transactions WHERE status = 'PAID'")->fetchColumn(),
];
$recentAlerts = $pdo->query("SELECT fa.*, u.full_name FROM fraud_alerts fa JOIN users u ON u.id = fa.user_id ORDER BY fa.created_at DESC LIMIT 5")->fetchAll();
$recentTx = $pdo->query("SELECT t.*, l.title FROM transactions t JOIN listings l ON l.id = t.listing_id ORDER BY t.created_at DESC LIMIT 5")->fetchAll();
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6">Vue d'ensemble</h1>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl p-5 border border-gray-200"><div class="text-3xl font-extrabold text-gray-900"><?= (int)$stats['users'] ?></div><div class="text-sm text-gray-500">Utilisateurs</div></div>
        <a href="/admin/listings.php" class="bg-white rounded-xl p-5 border border-gray-200 hover:shadow"><div class="text-3xl font-extrabold text-amber-500"><?= (int)$stats['listings_pending'] ?></div><div class="text-sm text-gray-500">Annonces à valider</div></a>
        <a href="/admin/transactions.php" class="bg-white rounded-xl p-5 border border-gray-200 hover:shadow"><div class="text-3xl font-extrabold text-blue-500"><?= (int)$stats['tx_paid'] ?></div><div class="text-sm text-gray-500">Paiements en séquestre</div></a>
        <a href="/admin/messages.php" class="bg-white rounded-xl p-5 border border-gray-200 hover:shadow"><div class="text-3xl font-extrabold text-red-500"><?= (int)$stats['fraud_new'] ?></div><div class="text-sm text-gray-500">Alertes fraude</div></a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="bg-gray-900 text-white rounded-xl p-6"><div class="text-sm text-gray-400">🔒 Fonds en séquestre</div><div class="text-2xl font-extrabold"><?= format_price($stats['escrow']) ?></div></div>
        <div class="bg-blue-600 text-white rounded-xl p-6"><div class="text-sm text-blue-200">💰 Commissions perçues (transactions terminées)</div><div class="text-2xl font-extrabold"><?= format_price($stats['commission_total']) ?></div></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="font-bold mb-4">🚨 Dernières alertes fraude</h3>
            <?php if (!$recentAlerts): ?><p class="text-sm text-gray-400">Aucune alerte.</p><?php endif; ?>
            <?php foreach ($recentAlerts as $a): ?>
            <div class="border-b border-gray-100 py-2 text-sm">
                <span class="font-semibold text-red-600"><?= h($a['alert_type']) ?></span> — <?= h($a['full_name']) ?>
                <span class="text-xs text-gray-400">(<?= time_ago($a['created_at']) ?>)</span>
            </div>
            <?php endforeach; ?>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="font-bold mb-4">💳 Dernières transactions</h3>
            <?php if (!$recentTx): ?><p class="text-sm text-gray-400">Aucune transaction.</p><?php endif; ?>
            <?php foreach ($recentTx as $t): ?>
            <div class="border-b border-gray-100 py-2 text-sm flex justify-between">
                <span class="truncate"><?= h($t['title']) ?></span>
                <span class="font-semibold whitespace-nowrap ml-2"><?= format_price($t['total_paid_by_buyer']) ?> <span class="text-xs text-gray-400"><?= tx_status_label($t['status']) ?></span></span>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>
</body></html>
