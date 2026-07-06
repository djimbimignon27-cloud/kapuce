<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

// Suppression d'une annonce
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    check_csrf();
    db()->prepare('DELETE FROM listings WHERE id = ? AND owner_id = ?')->execute([$_POST['listing_id'] ?? '', $user['id']]);
    flash('Annonce supprimée.');
    redirect('/dashboard/my-listings.php');
}

$stmt = db()->prepare('SELECT * FROM listings WHERE owner_id = ? ORDER BY created_at DESC');
$stmt->execute([$user['id']]);
$listings = $stmt->fetchAll();

$pageTitle = 'Mes annonces';
require_once __DIR__ . '/../includes/header.php';

$statusColors = ['ACTIVE' => 'bg-green-100 text-green-700', 'PENDING' => 'bg-amber-100 text-amber-700', 'REJECTED' => 'bg-red-100 text-red-700', 'SOLD' => 'bg-blue-100 text-blue-700', 'RENTED' => 'bg-blue-100 text-blue-700', 'SUSPENDED' => 'bg-gray-100 text-gray-600'];
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-extrabold text-gray-900">Mes annonces (<?= count($listings) ?>)</h1>
        <a href="/dashboard/create-listing.php" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold text-sm">+ Nouvelle annonce</a>
    </div>

    <?php if (!$listings): ?>
        <div class="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <div class="text-4xl mb-3">📦</div>
            <p class="text-gray-500 mb-4">Vous n'avez pas encore publié d'annonce.</p>
            <a href="/dashboard/create-listing.php" class="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-bold">Publier ma première annonce</a>
        </div>
    <?php else: ?>
    <div class="space-y-4">
        <?php foreach ($listings as $l): ?>
        <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
            <img src="<?= h(listing_first_image($l)) ?>" class="w-full sm:w-36 h-28 object-cover rounded-lg">
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $statusColors[$l['status']] ?? 'bg-gray-100' ?>"><?= status_label($l['status']) ?></span>
                    <span class="text-xs text-gray-400"><?= type_label($l['type']) ?> • <?= category_label($l['category']) ?></span>
                </div>
                <h3 class="font-bold text-gray-900"><?= h($l['title']) ?></h3>
                <div class="text-brand-600 font-bold"><?= format_price($l['price']) ?></div>
                <div class="text-xs text-gray-400 mt-1"><?= (int)$l['views_count'] ?> vues • Publiée <?= time_ago($l['created_at']) ?></div>
                <?php if ($l['status'] === 'REJECTED' && $l['rejection_reason']): ?>
                    <div class="text-xs text-red-600 mt-1">Motif du rejet : <?= h($l['rejection_reason']) ?></div>
                <?php endif; ?>
            </div>
            <div class="flex sm:flex-col gap-2 justify-end">
                <a href="/listing.php?id=<?= h($l['id']) ?>" class="text-sm border border-gray-300 rounded-lg px-4 py-1.5 text-gray-600 hover:bg-gray-50 text-center">Voir</a>
                <form method="post" onsubmit="return confirm('Supprimer cette annonce ?')">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="listing_id" value="<?= h($l['id']) ?>">
                    <button class="text-sm border border-red-200 text-red-600 rounded-lg px-4 py-1.5 hover:bg-red-50 w-full">Supprimer</button>
                </form>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
