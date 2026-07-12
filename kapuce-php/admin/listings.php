<?php
$pageTitle = 'Modération des annonces';
require_once __DIR__ . '/_header.php';

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $id = $_POST['listing_id'] ?? '';
    $action = $_POST['action'] ?? '';
    if ($action === 'approve') {
        $pdo->prepare("UPDATE listings SET status = 'ACTIVE', verified = 1, published_at = NOW(), rejection_reason = NULL WHERE id = ?")->execute([$id]);
        flash('Annonce approuvée et publiée.');
    } elseif ($action === 'reject') {
        $pdo->prepare("UPDATE listings SET status = 'REJECTED', rejection_reason = ? WHERE id = ?")->execute([trim($_POST['reason'] ?? 'Non conforme'), $id]);
        flash('Annonce rejetée.');
    } elseif ($action === 'suspend') {
        $pdo->prepare("UPDATE listings SET status = 'SUSPENDED' WHERE id = ?")->execute([$id]);
        flash('Annonce suspendue.');
    }
    redirect('/admin/listings.php?filter=' . urlencode($_GET['filter'] ?? 'PENDING'));
}

$filter = $_GET['filter'] ?? 'PENDING';
$sql = 'SELECT l.*, u.full_name AS owner_name, u.email AS owner_email FROM listings l JOIN users u ON u.id = l.owner_id';
$params = [];
if ($filter !== 'ALL') { $sql .= ' WHERE l.status = ?'; $params[] = $filter; }
$sql .= ' ORDER BY l.created_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-4">Modération des annonces</h1>
    <div class="flex gap-2 mb-6 overflow-x-auto">
        <?php foreach (['PENDING' => 'En attente', 'ACTIVE' => 'Actives', 'REJECTED' => 'Rejetées', 'SUSPENDED' => 'Suspendues', 'ALL' => 'Toutes'] as $k => $v): ?>
        <a href="?filter=<?= $k ?>" class="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap <?= $filter === $k ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600' ?>"><?= $v ?></a>
        <?php endforeach; ?>
    </div>

    <?php if (!$listings): ?><div class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">Aucune annonce.</div><?php endif; ?>
    <div class="space-y-4">
        <?php foreach ($listings as $l): ?>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col lg:flex-row gap-4">
            <img src="<?= h(listing_first_image($l)) ?>" class="w-full lg:w-40 h-28 object-cover rounded-lg">
            <div class="flex-1">
                <div class="text-xs text-gray-400 mb-1"><?= type_label($l['type']) ?> • <?= category_label($l['category']) ?> • <?= h($l['city']) ?> • Statut : <strong><?= status_label($l['status']) ?></strong></div>
                <h3 class="font-bold"><?= h($l['title']) ?></h3>
                <div class="text-blue-600 font-bold"><?= format_price($l['price']) ?></div>
                <div class="text-xs text-gray-500 mt-1">Par <?= h($l['owner_name']) ?> (<?= h($l['owner_email']) ?>)</div>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2"><?= h(mb_substr($l['description'], 0, 180)) ?>...</p>
            </div>
            <div class="flex lg:flex-col gap-2 justify-end">
                <a href="/listing.php?id=<?= h($l['id']) ?>" target="_blank" class="text-sm border border-gray-300 rounded-lg px-4 py-1.5 text-gray-600 text-center">Voir</a>
                <?php if ($l['status'] === 'PENDING' || $l['status'] === 'SUSPENDED'): ?>
                <form method="post"><input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="listing_id" value="<?= h($l['id']) ?>"><input type="hidden" name="action" value="approve">
                    <button class="w-full text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-1.5 font-semibold">✓ Approuver</button></form>
                <?php endif; ?>
                <?php if ($l['status'] === 'PENDING'): ?>
                <form method="post" onsubmit="const r = prompt('Motif du rejet :'); if (!r) return false; this.reason.value = r;">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="listing_id" value="<?= h($l['id']) ?>"><input type="hidden" name="action" value="reject"><input type="hidden" name="reason" value="">
                    <button class="w-full text-sm border border-red-200 text-red-600 rounded-lg px-4 py-1.5 font-semibold">✗ Rejeter</button></form>
                <?php endif; ?>
                <?php if ($l['status'] === 'ACTIVE'): ?>
                <form method="post"><input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="listing_id" value="<?= h($l['id']) ?>"><input type="hidden" name="action" value="suspend">
                    <button class="w-full text-sm border border-amber-300 text-amber-600 rounded-lg px-4 py-1.5 font-semibold">Suspendre</button></form>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
