<?php
$pageTitle = 'Avis & Notations';
require_once __DIR__ . '/_header.php';

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    check_csrf();
    $pdo->prepare('DELETE FROM reviews WHERE id = ?')->execute([$_POST['review_id'] ?? '']);
    flash('Avis supprimé.');
    redirect('/admin/reviews.php');
}

$reviews = $pdo->query('SELECT r.*, ur.full_name AS reviewer_name, ud.full_name AS reviewed_name, l.title AS listing_title FROM reviews r JOIN users ur ON ur.id = r.reviewer_id JOIN users ud ON ud.id = r.reviewed_id JOIN listings l ON l.id = r.listing_id ORDER BY r.created_at DESC LIMIT 100')->fetchAll();
$stats = $pdo->query('SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS avg_rating FROM reviews')->fetch();
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-4">Avis & Notations</h1>
    <div class="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <div class="bg-white rounded-xl p-5 border border-gray-200"><div class="text-3xl font-extrabold text-gray-900"><?= (int)$stats['total'] ?></div><div class="text-sm text-gray-500">Avis publiés</div></div>
        <div class="bg-white rounded-xl p-5 border border-gray-200"><div class="text-3xl font-extrabold text-amber-500"><?= number_format($stats['avg_rating'], 1) ?> ★</div><div class="text-sm text-gray-500">Note moyenne</div></div>
    </div>

    <?php if (!$reviews): ?><div class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">Aucun avis pour le moment.</div><?php endif; ?>
    <div class="space-y-3">
        <?php foreach ($reviews as $r): ?>
        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row justify-between gap-3">
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-amber-400 font-bold"><?= str_repeat('★', (int)$r['rating']) . str_repeat('☆', 5 - (int)$r['rating']) ?></span>
                    <span class="text-xs text-gray-400"><?= time_ago($r['created_at']) ?></span>
                </div>
                <div class="text-sm"><strong><?= h($r['reviewer_name']) ?></strong> a noté <strong><?= h($r['reviewed_name']) ?></strong> — <span class="text-purple-600"><?= h($r['listing_title']) ?></span></div>
                <?php if ($r['comment']): ?><p class="text-sm text-gray-600 mt-1 italic">« <?= h($r['comment']) ?> »</p><?php endif; ?>
            </div>
            <form method="post" onsubmit="return confirm('Supprimer cet avis ?')">
                <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="review_id" value="<?= h($r['id']) ?>"><input type="hidden" name="action" value="delete">
                <button class="text-sm border border-red-200 text-red-600 rounded-lg px-4 py-2 font-semibold whitespace-nowrap">Supprimer</button>
            </form>
        </div>
        <?php endforeach; ?>
    </div>
</div>
</body></html>
