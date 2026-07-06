<?php
require_once __DIR__ . '/includes/auth.php';
$user = require_login();

$txId = $_GET['id'] ?? '';
$stmt = db()->prepare('SELECT t.*, l.title AS listing_title, l.category AS listing_category, u.full_name AS seller_name FROM transactions t JOIN listings l ON l.id = t.listing_id JOIN users u ON u.id = t.seller_id WHERE t.id = ? AND t.buyer_id = ?');
$stmt->execute([$txId, $user['id']]);
$tx = $stmt->fetch();
if (!$tx) { flash('Transaction introuvable.', 'error'); redirect('/dashboard/transactions.php'); }

// --- POST : Paiement Mobile Money (SIMULÉ - en attente de l'API réelle Airtel/Moov) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $tx['status'] === 'PENDING_PAYMENT') {
    check_csrf();
    $method = in_array($_POST['method'] ?? '', ['AIRTEL_MONEY', 'MOOV_MONEY']) ? $_POST['method'] : 'AIRTEL_MONEY';
    $phone = trim($_POST['phone'] ?? '');
    if (mb_strlen($phone) < 8) {
        flash('Numéro Mobile Money invalide.', 'error');
        redirect('/pay.php?id=' . urlencode($txId));
    }
    $ref = 'KAP-' . strtoupper(substr(md5(uniqid()), 0, 10));
    db()->prepare("UPDATE transactions SET status = 'PAID', payment_method = ?, payment_phone = ?, payment_reference = ?, paid_at = NOW() WHERE id = ?")
        ->execute([$method, $phone, $ref, $txId]);

    // Notifier les deux parties via la messagerie (message système)
    $conv = get_or_create_conversation($tx['buyer_id'], $tx['seller_id'], $tx['listing_id'], $tx['listing_title']);
    send_message($conv['id'], 'SYSTEM', $tx['seller_id'], "💰 Le paiement de " . format_price($tx['total_paid_by_buyer']) . " a été reçu par KAPUCE.G (réf. $ref). Les fonds sont en séquestre et vous seront versés après validation par notre équipe.", true);

    flash('✅ Paiement effectué avec succès ! Vos fonds sont sécurisés en séquestre chez KAPUCE.G. Référence : ' . $ref);
    redirect('/dashboard/transactions.php');
}

$pageTitle = 'Paiement sécurisé';
require_once __DIR__ . '/includes/header.php';
?>
<div class="max-w-lg mx-auto px-4 py-12">
    <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h1 class="text-2xl font-extrabold text-gray-900 mb-1">🔒 Paiement sécurisé</h1>
        <p class="text-sm text-gray-500 mb-6">Séquestre KAPUCE.G — votre argent est protégé</p>

        <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Bien</span><span class="font-semibold text-right"><?= h($tx['listing_title']) ?></span></div>
            <div class="flex justify-between"><span class="text-gray-500">Type</span><span class="font-semibold"><?= $tx['transaction_type'] === 'RENT' ? 'Location' : 'Achat' ?></span></div>
            <div class="flex justify-between"><span class="text-gray-500">Montant du bien</span><span class="font-semibold"><?= format_price($tx['amount']) ?></span></div>
            <div class="flex justify-between"><span class="text-gray-500">Frais de service KAPUCE.G (<?= h($tx['commission_rate_client']) ?>%)</span><span class="font-semibold"><?= format_price($tx['commission_client']) ?></span></div>
            <div class="border-t border-gray-200 pt-2 flex justify-between text-base"><span class="font-bold">Total à payer</span><span class="font-extrabold text-brand-600"><?= format_price($tx['total_paid_by_buyer']) ?></span></div>
        </div>

        <?php if ($tx['status'] !== 'PENDING_PAYMENT'): ?>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-800 font-semibold">
                Cette transaction est déjà : <?= tx_status_label($tx['status']) ?><br>
                <a href="/dashboard/transactions.php" class="text-brand-600 underline text-sm">Voir mes transactions</a>
            </div>
        <?php else: ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Moyen de paiement</label>
                <div class="grid grid-cols-2 gap-3">
                    <label class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                        <input type="radio" name="method" value="AIRTEL_MONEY" checked class="sr-only">
                        <div class="font-bold text-red-600">Airtel Money</div>
                    </label>
                    <label class="border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                        <input type="radio" name="method" value="MOOV_MONEY" class="sr-only">
                        <div class="font-bold text-blue-600">Moov Money</div>
                    </label>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
                <input type="tel" name="phone" required placeholder="+241 XX XX XX XX" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <button class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-lg font-bold text-lg">Payer <?= format_price($tx['total_paid_by_buyer']) ?></button>
            <p class="text-xs text-gray-400 text-center">🛡️ Les fonds sont conservés par KAPUCE.G et versés au propriétaire uniquement après validation de la transaction.</p>
        </form>
        <?php endif; ?>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
