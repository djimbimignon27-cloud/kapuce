<?php
$pageTitle = 'Transactions';
require_once __DIR__ . '/_header.php';

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $id = $_POST['tx_id'] ?? '';
    $action = $_POST['action'] ?? '';
    $stmt = $pdo->prepare('SELECT * FROM transactions WHERE id = ?');
    $stmt->execute([$id]);
    $tx = $stmt->fetch();
    if ($tx) {
        if ($action === 'complete' && $tx['status'] === 'PAID') {
            $pdo->prepare("UPDATE transactions SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?")->execute([$id]);
            // Marquer le bien vendu/loué
            $newStatus = $tx['transaction_type'] === 'RENT' ? 'RENTED' : 'SOLD';
            $pdo->prepare('UPDATE listings SET status = ?, sold_at = NOW() WHERE id = ?')->execute([$newStatus, $tx['listing_id']]);
            $pdo->prepare('UPDATE users SET transactions_count = transactions_count + 1 WHERE id IN (?, ?)')->execute([$tx['buyer_id'], $tx['seller_id']]);
            // Notifier via messagerie
            $lt = $pdo->prepare('SELECT title FROM listings WHERE id = ?');
            $lt->execute([$tx['listing_id']]);
            $title = $lt->fetchColumn();
            $conv = get_or_create_conversation($tx['buyer_id'], $tx['seller_id'], $tx['listing_id'], $title);
            send_message($conv['id'], 'SYSTEM', $tx['seller_id'], '✅ Transaction validée par KAPUCE.G ! Le versement de ' . format_price($tx['seller_receives']) . ' (après commission) vous sera effectué sur votre compte Mobile Money.', true);
            flash('✅ Transaction validée. Le propriétaire recevra ' . format_price($tx['seller_receives']) . '.');
        } elseif ($action === 'refund' && in_array($tx['status'], ['PAID', 'DISPUTED'])) {
            $pdo->prepare("UPDATE transactions SET status = 'REFUNDED', admin_notes = ? WHERE id = ?")->execute([trim($_POST['reason'] ?? ''), $id]);
            flash('Transaction remboursée au client.');
        } elseif ($action === 'cancel' && $tx['status'] === 'PENDING_PAYMENT') {
            $pdo->prepare("UPDATE transactions SET status = 'CANCELLED' WHERE id = ?")->execute([$id]);
            flash('Transaction annulée.');
        }
    }
    redirect('/admin/transactions.php');
}

$filter = $_GET['filter'] ?? 'ALL';
$sql = 'SELECT t.*, l.title AS listing_title, ub.full_name AS buyer_name, us.full_name AS seller_name FROM transactions t JOIN listings l ON l.id = t.listing_id JOIN users ub ON ub.id = t.buyer_id JOIN users us ON us.id = t.seller_id';
$params = [];
if ($filter !== 'ALL') { $sql .= ' WHERE t.status = ?'; $params[] = $filter; }
$sql .= ' ORDER BY t.created_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$txs = $stmt->fetchAll();
$statusColors = ['PENDING_PAYMENT' => 'bg-amber-100 text-amber-700', 'PAID' => 'bg-blue-100 text-blue-700', 'COMPLETED' => 'bg-green-100 text-green-700', 'CANCELLED' => 'bg-gray-100 text-gray-600', 'REFUNDED' => 'bg-red-100 text-red-700'];
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-4">Validation des transactions (Séquestre)</h1>
    <div class="flex gap-2 mb-6 overflow-x-auto">
        <?php foreach (['ALL' => 'Toutes', 'PAID' => 'À valider (séquestre)', 'PENDING_PAYMENT' => 'En attente paiement', 'COMPLETED' => 'Terminées', 'REFUNDED' => 'Remboursées'] as $k => $v): ?>
        <a href="?filter=<?= $k ?>" class="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap <?= $filter === $k ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600' ?>"><?= $v ?></a>
        <?php endforeach; ?>
    </div>

    <?php if (!$txs): ?><div class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">Aucune transaction.</div><?php endif; ?>
    <div class="space-y-4">
        <?php foreach ($txs as $t): ?>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex flex-col lg:flex-row justify-between gap-4">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $statusColors[$t['status']] ?? 'bg-gray-100' ?>"><?= tx_status_label($t['status']) ?></span>
                        <span class="text-xs text-gray-400"><?= h($t['transaction_type']) ?> • <?= time_ago($t['created_at']) ?><?= $t['payment_reference'] ? ' • Réf : ' . h($t['payment_reference']) : '' ?></span>
                    </div>
                    <h3 class="font-bold"><?= h($t['listing_title']) ?></h3>
                    <div class="text-sm text-gray-500">Acheteur : <?= h($t['buyer_name']) ?> → Vendeur : <?= h($t['seller_name']) ?></div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                        <div class="bg-gray-50 rounded p-2"><div class="text-gray-400">Montant bien</div><div class="font-bold"><?= format_price($t['amount']) ?></div></div>
                        <div class="bg-blue-50 rounded p-2"><div class="text-gray-400">Payé par client (+<?= h($t['commission_rate_client']) ?>%)</div><div class="font-bold text-blue-700"><?= format_price($t['total_paid_by_buyer']) ?></div></div>
                        <div class="bg-green-50 rounded p-2"><div class="text-gray-400">Dû au vendeur (-<?= h($t['commission_rate_owner']) ?>%)</div><div class="font-bold text-green-700"><?= format_price($t['seller_receives']) ?></div></div>
                        <div class="bg-purple-50 rounded p-2"><div class="text-gray-400">Commission KAPUCE.G</div><div class="font-bold text-purple-700"><?= format_price($t['commission_client'] + $t['commission_owner']) ?></div></div>
                    </div>
                </div>
                <div class="flex lg:flex-col gap-2 justify-end">
                    <?php if ($t['status'] === 'PAID'): ?>
                    <form method="post" onsubmit="return confirm('Valider cette transaction et verser les fonds au vendeur ?')">
                        <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="tx_id" value="<?= h($t['id']) ?>"><input type="hidden" name="action" value="complete">
                        <button class="w-full text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-bold">✓ Valider & Verser</button>
                    </form>
                    <form method="post" onsubmit="const r = prompt('Motif du remboursement :'); if (!r) return false; this.reason.value = r;">
                        <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="tx_id" value="<?= h($t['id']) ?>"><input type="hidden" name="action" value="refund"><input type="hidden" name="reason" value="">
                        <button class="w-full text-sm border border-red-200 text-red-600 rounded-lg px-4 py-2 font-semibold">Rembourser</button>
                    </form>
                    <?php elseif ($t['status'] === 'PENDING_PAYMENT'): ?>
                    <form method="post"><input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="tx_id" value="<?= h($t['id']) ?>"><input type="hidden" name="action" value="cancel">
                        <button class="text-sm border border-gray-300 text-gray-600 rounded-lg px-4 py-2">Annuler</button></form>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
</body></html>
