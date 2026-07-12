<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/_header.php';

$stats = [
    'users' => $badgeUsers,
    'users_today' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()")->fetchColumn(),
    'listings_active' => (int)$pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'ACTIVE'")->fetchColumn(),
    'listings_pending' => $badgeListingsPending,
    'tx_total' => (int)$pdo->query('SELECT COUNT(*) FROM transactions')->fetchColumn(),
    'tx_paid' => $badgeTx,
    'fraud_pending' => $badgeAlertsPending,
    'commission_total' => $pdo->query("SELECT COALESCE(SUM(commission_client + commission_owner), 0) FROM transactions WHERE status = 'COMPLETED'")->fetchColumn(),
    'escrow' => $pdo->query("SELECT COALESCE(SUM(total_paid_by_buyer), 0) FROM transactions WHERE status = 'PAID'")->fetchColumn(),
];
$recentAlerts = $pdo->query("SELECT fa.*, u.full_name FROM fraud_alerts fa JOIN users u ON u.id = fa.user_id ORDER BY fa.created_at DESC LIMIT 5")->fetchAll();
$recentTx = $pdo->query("SELECT t.*, l.title FROM transactions t JOIN listings l ON l.id = t.listing_id ORDER BY t.created_at DESC LIMIT 5")->fetchAll();
$recentUsers = $pdo->query("SELECT * FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll();
?>
<div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all p-6">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Total Utilisateurs</p>
                    <p class="text-4xl font-black text-gray-900"><?= $stats['users'] ?></p>
                    <div class="flex items-center gap-1 mt-2 text-green-500 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                        <span class="font-medium">+<?= $stats['users_today'] ?> aujourd'hui</span>
                    </div>
                </div>
                <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
            </div>
        </div>
        <a href="/admin/listings.php" class="bg-white border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all p-6 block">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Annonces à valider</p>
                    <p class="text-4xl font-black text-gray-900"><?= $stats['listings_pending'] ?></p>
                    <p class="text-sm text-gray-400 mt-2"><?= $stats['listings_active'] ?> actives</p>
                </div>
                <div class="w-14 h-14 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-kama-gold/30 group-hover:scale-110 transition-transform">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
            </div>
        </a>
        <a href="/admin/transactions.php" class="bg-white border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all p-6 block">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Paiements en séquestre</p>
                    <p class="text-4xl font-black text-gray-900"><?= $stats['tx_paid'] ?></p>
                    <p class="text-sm text-gray-400 mt-2"><?= $stats['tx_total'] ?> transactions au total</p>
                </div>
                <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
            </div>
        </a>
        <a href="/admin/alerts.php" class="bg-white border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all p-6 block">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Alertes Fraude</p>
                    <p class="text-4xl font-black text-gray-900"><?= $stats['fraud_pending'] ?></p>
                    <p class="text-sm text-red-500 mt-2 font-medium"><?= $stats['fraud_pending'] > 0 ? '⚠️ Action requise' : '✓ Tout est en ordre' ?></p>
                </div>
                <div class="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
            </div>
        </a>
    </div>

    <!-- Finances -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white rounded-2xl p-6 shadow-lg">
            <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">🔒</span>
                <div class="text-sm text-gray-400">Fonds en séquestre</div>
            </div>
            <div class="text-3xl font-black"><?= format_price($stats['escrow']) ?></div>
            <p class="text-xs text-gray-500 mt-2">En attente de validation et versement aux propriétaires</p>
        </div>
        <div class="bg-gradient-to-br from-kama-gold to-yellow-600 text-white rounded-2xl p-6 shadow-lg shadow-kama-gold/20">
            <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">💰</span>
                <div class="text-sm text-yellow-100">Commissions perçues</div>
            </div>
            <div class="text-3xl font-black"><?= format_price($stats['commission_total']) ?></div>
            <p class="text-xs text-yellow-100/80 mt-2">Total des doubles commissions sur transactions terminées</p>
        </div>
    </div>

    <!-- Activité récente -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-2xl shadow-lg border-0 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-900">🚨 Dernières alertes</h3>
                <a href="/admin/alerts.php" class="text-xs text-red-500 font-semibold hover:underline">Tout voir →</a>
            </div>
            <?php if (!$recentAlerts): ?><p class="text-sm text-gray-400 py-4 text-center">Aucune alerte 🎉</p><?php endif; ?>
            <?php foreach ($recentAlerts as $a): ?>
            <div class="border-b border-gray-50 py-2.5 text-sm">
                <span class="font-semibold text-red-600"><?= h($a['alert_type']) ?></span>
                <div class="text-xs text-gray-500"><?= h($a['full_name']) ?> • <?= time_ago($a['created_at']) ?></div>
            </div>
            <?php endforeach; ?>
        </div>
        <div class="bg-white rounded-2xl shadow-lg border-0 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-900">💳 Dernières transactions</h3>
                <a href="/admin/transactions.php" class="text-xs text-kama-gold font-semibold hover:underline">Tout voir →</a>
            </div>
            <?php if (!$recentTx): ?><p class="text-sm text-gray-400 py-4 text-center">Aucune transaction</p><?php endif; ?>
            <?php foreach ($recentTx as $t): ?>
            <div class="border-b border-gray-50 py-2.5 text-sm flex justify-between gap-2">
                <span class="truncate text-gray-700"><?= h($t['title']) ?></span>
                <span class="font-bold whitespace-nowrap text-gray-900"><?= format_price($t['total_paid_by_buyer']) ?></span>
            </div>
            <?php endforeach; ?>
        </div>
        <div class="bg-white rounded-2xl shadow-lg border-0 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-900">👥 Nouveaux membres</h3>
                <a href="/admin/users.php" class="text-xs text-blue-500 font-semibold hover:underline">Tout voir →</a>
            </div>
            <?php foreach ($recentUsers as $u): ?>
            <div class="border-b border-gray-50 py-2.5 text-sm flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-kama-blue to-blue-700 text-white rounded-full flex items-center justify-center font-bold text-xs"><?= h(mb_strtoupper(mb_substr($u['full_name'], 0, 1))) ?></div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-800 truncate"><?= h($u['full_name']) ?></div>
                    <div class="text-xs text-gray-400"><?= h($u['role']) ?> • <?= time_ago($u['created_at']) ?></div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
