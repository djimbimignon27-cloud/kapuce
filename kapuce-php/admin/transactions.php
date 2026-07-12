<?php
$pageTitle = 'Gestion des Transactions';
require_once __DIR__ . '/_header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $id = $_POST['tx_id'] ?? '';
    $action = $_POST['action'] ?? '';
    $stmt = $pdo->prepare('SELECT * FROM transactions WHERE id = ?');
    $stmt->execute([$id]);
    $tx = $stmt->fetch();
    if ($tx) {
        if ($action === 'update_commission' && in_array($tx['status'], ['PENDING_PAYMENT', 'PAID'])) {
            // Ajustement individuel du taux de commission propriétaire (0-20%)
            $rate = max(0, min(20, (float)($_POST['commission_rate'] ?? $tx['commission_rate_owner'])));
            $notes = trim($_POST['admin_notes'] ?? '');
            $commOwner = (int)round($tx['amount'] * $rate / 100);
            $pdo->prepare('UPDATE transactions SET commission_rate_owner = ?, commission_owner = ?, seller_receives = ?, admin_notes = ?, commission_modified = 1 WHERE id = ?')
                ->execute([$rate, $commOwner, $tx['amount'] - $commOwner, $notes ?: null, $id]);
            flash('⚙️ Commission modifiée : ' . $rate . '% — Le vendeur recevra ' . format_price($tx['amount'] - $commOwner) . '.');
        } elseif ($action === 'complete' && $tx['status'] === 'PAID') {
            $pdo->prepare("UPDATE transactions SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?")->execute([$id]);
            $newStatus = $tx['transaction_type'] === 'RENT' ? 'RENTED' : 'SOLD';
            $pdo->prepare('UPDATE listings SET status = ?, sold_at = NOW() WHERE id = ?')->execute([$newStatus, $tx['listing_id']]);
            $pdo->prepare('UPDATE users SET transactions_count = transactions_count + 1 WHERE id IN (?, ?)')->execute([$tx['buyer_id'], $tx['seller_id']]);
            $lt = $pdo->prepare('SELECT title FROM listings WHERE id = ?');
            $lt->execute([$tx['listing_id']]);
            $title = $lt->fetchColumn();
            $conv = get_or_create_conversation($tx['buyer_id'], $tx['seller_id'], $tx['listing_id'], $title);
            send_message($conv['id'], 'SYSTEM', $tx['seller_id'], '✅ Transaction validée par KAPUCE.G ! Le versement de ' . format_price($tx['seller_receives']) . ' (après commission) vous sera effectué sur votre compte Mobile Money.', true);
            notify($tx['seller_id'], 'TX_COMPLETED', 'Transaction validée 💰', 'KAPUCE.G a validé la transaction "' . $title . '". Vous recevrez ' . format_price($tx['seller_receives']) . '.', '/dashboard/transactions.php');
            notify($tx['buyer_id'], 'TX_COMPLETED', 'Transaction terminée ✅', 'Votre transaction pour "' . $title . '" est validée. Vous pouvez noter le propriétaire.', '/dashboard/transactions.php');
            flash('✅ Transaction validée. Le propriétaire recevra ' . format_price($tx['seller_receives']) . '.');
        } elseif ($action === 'refund' && in_array($tx['status'], ['PAID', 'DISPUTED'])) {
            $pdo->prepare("UPDATE transactions SET status = 'REFUNDED', admin_notes = ? WHERE id = ?")->execute([trim($_POST['reason'] ?? ''), $id]);
            notify($tx['buyer_id'], 'TX_REFUNDED', 'Remboursement effectué', 'Votre paiement a été remboursé par KAPUCE.G.', '/dashboard/transactions.php');
            flash('Transaction remboursée au client.');
        } elseif ($action === 'cancel' && $tx['status'] === 'PENDING_PAYMENT') {
            $pdo->prepare("UPDATE transactions SET status = 'CANCELLED' WHERE id = ?")->execute([$id]);
            flash('Transaction annulée.');
        }
    }
    redirect('/admin/transactions.php?filter=' . urlencode($_GET['filter'] ?? 'ALL'));
}

$filter = $_GET['filter'] ?? 'ALL';
$sql = 'SELECT t.*, l.title AS listing_title, ub.full_name AS buyer_name, us.full_name AS seller_name FROM transactions t JOIN listings l ON l.id = t.listing_id JOIN users ub ON ub.id = t.buyer_id JOIN users us ON us.id = t.seller_id';
$params = [];
if ($filter !== 'ALL') { $sql .= ' WHERE t.status = ?'; $params[] = $filter; }
$sql .= ' ORDER BY t.created_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$txs = $stmt->fetchAll();
$statusColors = ['PENDING_PAYMENT' => 'bg-amber-100 text-amber-700', 'PAID' => 'bg-blue-100 text-blue-700', 'COMPLETED' => 'bg-green-100 text-green-700', 'CANCELLED' => 'bg-gray-100 text-gray-600', 'REFUNDED' => 'bg-red-100 text-red-700', 'DISPUTED' => 'bg-red-100 text-red-700'];
?>
<!-- Bannière dorée : gestion des commissions -->
<div class="bg-gradient-to-r from-kama-gold/15 to-yellow-50 border border-kama-gold/40 rounded-2xl p-5 mb-6 flex items-start gap-4">
    <div class="w-11 h-11 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-kama-gold/30">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
    </div>
    <div>
        <h3 class="font-bold text-gray-900">Gestion des commissions</h3>
        <p class="text-sm text-gray-600">Vous pouvez ajuster le taux de commission pour chaque transaction individuellement avant validation finale. Les fonds sont conservés en séquestre jusqu'à votre validation.</p>
    </div>
</div>

<div class="flex gap-2 mb-6 overflow-x-auto">
    <?php foreach (['ALL' => 'Toutes', 'PAID' => '🔒 À valider (séquestre)', 'PENDING_PAYMENT' => 'En attente paiement', 'COMPLETED' => 'Terminées', 'REFUNDED' => 'Remboursées'] as $k => $v): ?>
    <a href="?filter=<?= $k ?>" class="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap <?= $filter === $k ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' ?>"><?= $v ?></a>
    <?php endforeach; ?>
</div>

<?php if (!$txs): ?><div class="bg-white rounded-2xl shadow-lg border border-dashed border-gray-200 p-16 text-center text-gray-400">Aucune transaction.</div><?php endif; ?>
<div class="space-y-4">
    <?php foreach ($txs as $t): ?>
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
        <div class="flex flex-col lg:flex-row justify-between gap-4">
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full <?= $statusColors[$t['status']] ?? 'bg-gray-100' ?>"><?= tx_status_label($t['status']) ?></span>
                    <?php if ($t['commission_modified']): ?><span class="text-xs font-bold bg-kama-gold/20 text-kama-gold border border-kama-gold/40 px-2.5 py-1 rounded-full">⚙️ Modifié par admin</span><?php endif; ?>
                    <span class="text-xs text-gray-400"><?= $t['transaction_type'] === 'RENT' ? 'Location' : 'Vente' ?> • <?= time_ago($t['created_at']) ?><?= $t['payment_reference'] ? ' • Réf : ' . h($t['payment_reference']) : '' ?><?= $t['payment_method'] ? ' • ' . ($t['payment_method'] === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money') : '' ?></span>
                </div>
                <h3 class="font-bold text-gray-900"><?= h($t['listing_title']) ?></h3>
                <div class="text-sm text-gray-500">Acheteur : <strong><?= h($t['buyer_name']) ?></strong> → Vendeur : <strong><?= h($t['seller_name']) ?></strong></div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                    <div class="bg-gray-50 rounded-xl p-2.5"><div class="text-gray-400">Montant bien</div><div class="font-bold text-gray-900"><?= format_price($t['amount']) ?></div></div>
                    <div class="bg-blue-50 rounded-xl p-2.5"><div class="text-gray-400">Payé par client (+<?= h($t['commission_rate_client']) ?>%)</div><div class="font-bold text-blue-700"><?= format_price($t['total_paid_by_buyer']) ?></div></div>
                    <div class="bg-yellow-50 rounded-xl p-2.5"><div class="text-gray-400">Commission (<?= h($t['commission_rate_owner']) ?>% prop.)</div><div class="font-black text-kama-gold"><?= format_price($t['commission_client'] + $t['commission_owner']) ?></div></div>
                    <div class="bg-green-50 rounded-xl p-2.5"><div class="text-gray-400">Vendeur reçoit</div><div class="font-bold text-green-700"><?= format_price($t['seller_receives']) ?></div></div>
                </div>
                <?php if ($t['admin_notes']): ?><div class="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">📝 Note admin : <?= h($t['admin_notes']) ?></div><?php endif; ?>
            </div>
            <div class="flex lg:flex-col gap-2 justify-end flex-shrink-0">
                <?php if (in_array($t['status'], ['PENDING_PAYMENT', 'PAID'])): ?>
                <button onclick='openCommissionModal(<?= json_encode(['id' => $t['id'], 'title' => $t['listing_title'], 'amount' => (int)$t['amount'], 'rate' => (float)$t['commission_rate_owner'], 'notes' => $t['admin_notes'] ?? '']) ?>)' class="text-sm bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg text-white rounded-xl px-4 py-2 font-bold whitespace-nowrap">⚙️ Modifier commission</button>
                <?php endif; ?>
                <?php if ($t['status'] === 'PAID'): ?>
                <form method="post" onsubmit="return confirm('Valider cette transaction et verser les fonds au vendeur ?')">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="tx_id" value="<?= h($t['id']) ?>"><input type="hidden" name="action" value="complete">
                    <button class="w-full text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 font-bold whitespace-nowrap">✓ Valider & Verser</button>
                </form>
                <form method="post" onsubmit="const r = prompt('Motif du remboursement :'); if (!r) return false; this.reason.value = r;">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="tx_id" value="<?= h($t['id']) ?>"><input type="hidden" name="action" value="refund"><input type="hidden" name="reason" value="">
                    <button class="w-full text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-4 py-2 font-semibold whitespace-nowrap">Rembourser</button>
                </form>
                <?php elseif ($t['status'] === 'PENDING_PAYMENT'): ?>
                <form method="post"><input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="tx_id" value="<?= h($t['id']) ?>"><input type="hidden" name="action" value="cancel">
                    <button class="text-sm border border-gray-300 text-gray-600 rounded-xl px-4 py-2 whitespace-nowrap">Annuler</button></form>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <?php endforeach; ?>
</div>

<!-- Modal Modification Commission -->
<div id="commissionModal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <h3 class="font-bold text-xl text-gray-900 mb-1">⚙️ Modifier la Commission</h3>
        <p class="text-sm text-gray-500 mb-4">Ajustez le taux de commission pour cette transaction spécifique</p>
        <div class="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
            <div id="cmTitle" class="font-semibold text-gray-800"></div>
            <div class="text-gray-500">Montant : <span id="cmAmount" class="font-bold text-gray-900"></span></div>
        </div>
        <form method="post">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="hidden" name="tx_id" id="cmTxId">
            <input type="hidden" name="action" value="update_commission">
            <label class="block text-sm font-bold text-gray-700 mb-2">Taux de commission propriétaire : <span id="cmRateLabel" class="text-kama-gold text-lg"></span></label>
            <input type="range" name="commission_rate" id="cmRate" min="0" max="20" step="0.5" oninput="updateCommissionCalc()" class="w-full accent-yellow-500 mb-4">
            <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div class="bg-yellow-50 border border-kama-gold/30 rounded-xl p-3">
                    <div class="text-xs text-gray-500">Commission KAPUCE.G</div>
                    <div id="cmCommission" class="font-black text-kama-gold text-lg"></div>
                </div>
                <div class="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div class="text-xs text-gray-500">Le vendeur recevra</div>
                    <div id="cmSeller" class="font-black text-green-700 text-lg"></div>
                </div>
            </div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes admin (optionnel)</label>
            <textarea name="admin_notes" id="cmNotes" rows="2" placeholder="Raison de la modification..." class="w-full border border-gray-200 rounded-xl px-3 py-2 mb-4 text-sm"></textarea>
            <div class="flex gap-2">
                <button type="button" onclick="document.getElementById('commissionModal').classList.add('hidden')" class="flex-1 border border-gray-300 rounded-xl py-2.5 font-semibold text-gray-600">Annuler</button>
                <button class="flex-1 bg-gradient-to-r from-kama-gold to-yellow-600 text-white rounded-xl py-2.5 font-bold">Enregistrer</button>
            </div>
        </form>
    </div>
</div>
<script>
let cmAmount = 0;
function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'; }
function openCommissionModal(tx) {
    cmAmount = tx.amount;
    document.getElementById('cmTxId').value = tx.id;
    document.getElementById('cmTitle').textContent = tx.title;
    document.getElementById('cmAmount').textContent = fmt(tx.amount);
    document.getElementById('cmRate').value = tx.rate;
    document.getElementById('cmNotes').value = tx.notes || '';
    updateCommissionCalc();
    document.getElementById('commissionModal').classList.remove('hidden');
}
function updateCommissionCalc() {
    const rate = parseFloat(document.getElementById('cmRate').value);
    const commission = cmAmount * rate / 100;
    document.getElementById('cmRateLabel').textContent = rate + '%';
    document.getElementById('cmCommission').textContent = fmt(commission);
    document.getElementById('cmSeller').textContent = fmt(cmAmount - commission);
}
</script>
<?php require_once __DIR__ . '/_footer.php'; ?>
