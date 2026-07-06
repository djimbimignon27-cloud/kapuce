<?php
$pageTitle = 'Messages & Alertes fraude';
require_once __DIR__ . '/_header.php';

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'resolve_alert') {
    check_csrf();
    $pdo->prepare("UPDATE fraud_alerts SET status = 'RESOLVED' WHERE id = ?")->execute([$_POST['alert_id'] ?? '']);
    flash('Alerte marquée comme traitée.');
    redirect('/admin/messages.php');
}

$tab = $_GET['tab'] ?? 'alerts';

$alerts = $pdo->query("SELECT fa.*, u.full_name, u.email, u.fraud_risk_level FROM fraud_alerts fa JOIN users u ON u.id = fa.user_id ORDER BY FIELD(fa.status, 'NEW') DESC, fa.created_at DESC LIMIT 100")->fetchAll();

$convId = $_GET['conv'] ?? null;
$conversations = $pdo->query("SELECT c.*, u1.full_name AS p1_name, u2.full_name AS p2_name FROM conversations c JOIN users u1 ON u1.id = c.participant1_id JOIN users u2 ON u2.id = c.participant2_id ORDER BY c.updated_at DESC LIMIT 100")->fetchAll();
$convMessages = [];
if ($convId) {
    $stmt = $pdo->prepare('SELECT m.*, u.full_name AS sender_name FROM messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at ASC');
    $stmt->execute([$convId]);
    $convMessages = $stmt->fetchAll();
}
$sevColors = ['LOW' => 'bg-yellow-100 text-yellow-700', 'MEDIUM' => 'bg-amber-100 text-amber-700', 'HIGH' => 'bg-orange-100 text-orange-700', 'CRITICAL' => 'bg-red-100 text-red-700'];
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-4">Supervision des messages & alertes fraude</h1>
    <div class="flex gap-2 mb-6">
        <a href="?tab=alerts" class="px-4 py-2 rounded-lg text-sm font-semibold <?= $tab === 'alerts' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600' ?>">🚨 Alertes fraude</a>
        <a href="?tab=conversations" class="px-4 py-2 rounded-lg text-sm font-semibold <?= $tab === 'conversations' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600' ?>">💬 Conversations</a>
    </div>

    <?php if ($tab === 'alerts'): ?>
    <?php if (!$alerts): ?><div class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">Aucune alerte fraude. 🎉</div><?php endif; ?>
    <div class="space-y-3">
        <?php foreach ($alerts as $a): ?>
        <div class="bg-white rounded-xl border <?= $a['status'] === 'NEW' ? 'border-red-300' : 'border-gray-200' ?> p-4">
            <div class="flex flex-col sm:flex-row justify-between gap-3">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="text-xs font-bold px-2 py-0.5 rounded <?= $sevColors[$a['severity']] ?? '' ?>"><?= h($a['severity']) ?></span>
                        <span class="text-xs font-bold bg-gray-800 text-white px-2 py-0.5 rounded"><?= h($a['alert_type']) ?></span>
                        <span class="text-xs <?= $a['status'] === 'NEW' ? 'text-red-600 font-bold' : 'text-gray-400' ?>"><?= $a['status'] === 'NEW' ? 'NOUVELLE' : 'Traitée' ?></span>
                        <span class="text-xs text-gray-400"><?= time_ago($a['created_at']) ?></span>
                    </div>
                    <div class="text-sm"><strong><?= h($a['full_name']) ?></strong> (<?= h($a['email']) ?>) — Risque : <?= h($a['fraud_risk_level']) ?></div>
                    <div class="bg-red-50 border border-red-100 rounded-lg p-2 mt-2 text-sm text-gray-700">
                        <span class="text-xs text-red-500 font-semibold">Contenu original détecté :</span><br><?= h($a['detected_content']) ?>
                    </div>
                    <?php if ($a['conversation_id']): ?><a href="?tab=conversations&conv=<?= h($a['conversation_id']) ?>" class="text-xs text-purple-600 font-semibold">Voir la conversation →</a><?php endif; ?>
                </div>
                <?php if ($a['status'] === 'NEW'): ?>
                <form method="post">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="alert_id" value="<?= h($a['id']) ?>"><input type="hidden" name="action" value="resolve_alert">
                    <button class="text-sm bg-gray-800 text-white rounded-lg px-4 py-2 font-semibold whitespace-nowrap">Marquer traitée</button>
                </form>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <?php else: ?>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 overflow-y-auto" style="max-height: 600px">
            <?php foreach ($conversations as $c): ?>
            <a href="?tab=conversations&conv=<?= h($c['id']) ?>" class="block p-3 border-b border-gray-100 hover:bg-gray-50 <?= $convId === $c['id'] ? 'bg-purple-50' : '' ?>">
                <div class="text-sm font-semibold"><?= h($c['p1_name']) ?> ↔ <?= h($c['p2_name']) ?></div>
                <?php if ($c['listing_title']): ?><div class="text-xs text-purple-600 truncate">📌 <?= h($c['listing_title']) ?></div><?php endif; ?>
                <div class="text-xs text-gray-400 truncate"><?= h($c['last_message'] ?? '') ?></div>
            </a>
            <?php endforeach; ?>
        </div>
        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto" style="max-height: 600px">
            <?php if (!$convId): ?>
                <p class="text-gray-400 text-center py-16">Sélectionnez une conversation à superviser</p>
            <?php else: ?>
            <div class="space-y-3">
                <?php foreach ($convMessages as $m): ?>
                <div class="<?= $m['is_system'] ? 'text-center' : '' ?>">
                    <?php if ($m['is_system']): ?>
                        <span class="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-lg"><?= h($m['content']) ?></span>
                    <?php else: ?>
                    <div class="bg-gray-50 rounded-lg p-3 text-sm">
                        <div class="flex justify-between">
                            <strong><?= h($m['sender_name'] ?? 'Système') ?></strong>
                            <span class="text-xs text-gray-400"><?= date('d/m H:i', strtotime($m['created_at'])) ?></span>
                        </div>
                        <div class="text-gray-700"><?= h($m['content']) ?></div>
                        <?php if ($m['is_filtered']): ?>
                        <div class="mt-1 bg-red-50 border border-red-100 rounded p-2 text-xs">
                            <span class="text-red-600 font-bold">⚠️ FILTRÉ (<?= h($m['filter_reason']) ?>)</span> — Original : <?= h($m['original_content']) ?>
                        </div>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</div>
</body></html>
