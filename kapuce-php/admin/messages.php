<?php
$pageTitle = 'Supervision des Messages';
require_once __DIR__ . '/_header.php';

$convId = $_GET['conv'] ?? null;
$conversations = $pdo->query("SELECT c.*, u1.full_name AS p1_name, u2.full_name AS p2_name,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_filtered = 1) AS filtered_count
    FROM conversations c JOIN users u1 ON u1.id = c.participant1_id JOIN users u2 ON u2.id = c.participant2_id ORDER BY c.updated_at DESC LIMIT 100")->fetchAll();
$convMessages = [];
if ($convId) {
    $stmt = $pdo->prepare('SELECT m.*, u.full_name AS sender_name FROM messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at ASC');
    $stmt->execute([$convId]);
    $convMessages = $stmt->fetchAll();
}
$totalFiltered = (int)$pdo->query('SELECT COUNT(*) FROM messages WHERE is_filtered = 1')->fetchColumn();
$totalMessages = (int)$pdo->query('SELECT COUNT(*) FROM messages WHERE is_system = 0')->fetchColumn();
?>
<div class="grid grid-cols-3 gap-4 mb-6 max-w-2xl">
    <div class="bg-white rounded-2xl shadow-lg p-4"><p class="text-2xl font-black text-gray-900"><?= count($conversations) ?></p><p class="text-xs text-gray-500 font-medium">Conversations</p></div>
    <div class="bg-white rounded-2xl shadow-lg p-4"><p class="text-2xl font-black text-gray-900"><?= $totalMessages ?></p><p class="text-xs text-gray-500 font-medium">Messages échangés</p></div>
    <div class="bg-white rounded-2xl shadow-lg p-4"><p class="text-2xl font-black text-red-500"><?= $totalFiltered ?></p><p class="text-xs text-gray-500 font-medium">Messages filtrés</p></div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-y-auto" style="max-height: 620px">
        <div class="px-4 py-3 bg-gradient-to-r from-gray-900 to-slate-900 text-white font-bold text-sm sticky top-0">Toutes les conversations</div>
        <?php if (!$conversations): ?><p class="p-8 text-center text-gray-400 text-sm">Aucune conversation.</p><?php endif; ?>
        <?php foreach ($conversations as $c): ?>
        <a href="?conv=<?= h($c['id']) ?>" class="block p-3.5 border-b border-gray-50 hover:bg-slate-50 <?= $convId === $c['id'] ? 'bg-red-50 border-l-4 border-l-red-500' : '' ?>">
            <div class="flex justify-between items-start gap-2">
                <div class="text-sm font-semibold text-gray-900"><?= h($c['p1_name']) ?> ↔ <?= h($c['p2_name']) ?></div>
                <?php if ($c['filtered_count'] > 0): ?><span class="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">⚠️ <?= $c['filtered_count'] ?></span><?php endif; ?>
            </div>
            <?php if ($c['listing_title']): ?><div class="text-xs text-kama-blue truncate">📌 <?= h($c['listing_title']) ?></div><?php endif; ?>
            <div class="text-xs text-gray-400 truncate mt-0.5"><?= h($c['last_message'] ?? '') ?></div>
        </a>
        <?php endforeach; ?>
    </div>
    <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 overflow-y-auto" style="max-height: 620px">
        <?php if (!$convId): ?>
            <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                <div class="text-4xl mb-3">🔍</div>
                <p>Sélectionnez une conversation à superviser</p>
            </div>
        <?php else: ?>
        <div class="space-y-3">
            <?php foreach ($convMessages as $m): ?>
            <div class="<?= $m['is_system'] ? 'text-center' : '' ?>">
                <?php if ($m['is_system']): ?>
                    <span class="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-xl max-w-md"><?= h($m['content']) ?></span>
                <?php else: ?>
                <div class="bg-slate-50 rounded-xl p-3 text-sm <?= $m['is_filtered'] ? 'border-2 border-red-200' : '' ?>">
                    <div class="flex justify-between">
                        <strong class="text-gray-900"><?= h($m['sender_name'] ?? 'Système') ?></strong>
                        <span class="text-xs text-gray-400"><?= date('d/m H:i', strtotime($m['created_at'])) ?></span>
                    </div>
                    <?php if (!empty($m['image_url'])): ?>
                    <a href="<?= h($m['image_url']) ?>" target="_blank" class="block mt-1 mb-1"><img src="<?= h($m['image_url']) ?>" class="rounded-xl max-h-48 border border-gray-200" alt="Pièce jointe"></a>
                    <?php endif; ?>
                    <div class="text-gray-700 mt-0.5"><?= h($m['content']) ?></div>
                    <?php if ($m['is_filtered']): ?>
                    <div class="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-xs">
                        <span class="text-red-600 font-bold">⚠️ FILTRÉ (<?= h($m['filter_reason']) ?>)</span> — Contenu original : <span class="text-gray-600"><?= h($m['original_content']) ?></span>
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
<?php require_once __DIR__ . '/_footer.php'; ?>
