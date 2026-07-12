<?php
require_once __DIR__ . '/includes/auth.php';
$user = require_login();

$txId = $_GET['id'] ?? '';
$stmt = db()->prepare('SELECT t.*, l.title AS listing_title, l.address AS listing_address, l.city AS listing_city, l.category AS listing_category, l.id AS lid, u.full_name AS seller_name FROM transactions t JOIN listings l ON l.id = t.listing_id JOIN users u ON u.id = t.seller_id WHERE t.id = ? AND t.buyer_id = ?');
$stmt->execute([$txId, $user['id']]);
$tx = $stmt->fetch();
if (!$tx) { flash('Transaction introuvable.', 'error'); redirect('/dashboard/transactions.php'); }

// --- POST : Confirmation du paiement Mobile Money ---
// Le client envoie l'argent aux comptes officiels KAPUCE.G (Airtel/Moov)
// puis saisit la référence de transaction reçue par SMS. (Vérification manuelle par l'admin - API marchande à venir)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $tx['status'] === 'PENDING_PAYMENT') {
    check_csrf();
    $method = in_array($_POST['method'] ?? '', ['AIRTEL_MONEY', 'MOOV_MONEY']) ? $_POST['method'] : 'AIRTEL_MONEY';
    $reference = trim($_POST['payment_reference'] ?? '');
    $comment = trim($_POST['comment'] ?? '');
    if (mb_strlen($reference) < 4) {
        flash('Veuillez saisir la référence de transaction reçue par SMS.', 'error');
        redirect('/pay.php?id=' . urlencode($txId));
    }
    db()->prepare("UPDATE transactions SET status = 'PAID', payment_method = ?, payment_reference = ?, notes = ?, paid_at = NOW() WHERE id = ?")
        ->execute([$method, $reference, $comment ?: null, $txId]);

    // Message système + notifications
    $conv = get_or_create_conversation($tx['buyer_id'], $tx['seller_id'], $tx['listing_id'], $tx['listing_title']);
    send_message($conv['id'], 'SYSTEM', $tx['seller_id'], "💰 Le paiement de " . format_price($tx['total_paid_by_buyer']) . " a été déclaré (réf. $reference). KAPUCE.G vérifie le paiement : les fonds sont en séquestre et seront versés au propriétaire après validation (sous 24-48h).", true);
    notify($tx['seller_id'], 'PAYMENT', 'Paiement reçu en séquestre', 'Un client a payé pour "' . $tx['listing_title'] . '". Validation KAPUCE.G en cours.', '/dashboard/transactions.php');
    notify($tx['buyer_id'], 'PAYMENT', 'Paiement enregistré', 'Votre paiement pour "' . $tx['listing_title'] . '" est en cours de vérification (24-48h).', '/dashboard/transactions.php');

    // ÉTAPE OBLIGATOIRE : envoi de la capture d'écran au support KAPUCE.G
    $support = get_support_conversation($tx['buyer_id']);
    if ($support) {
        $methodLabel = $method === 'AIRTEL_MONEY' ? 'Airtel Money (' . CONTACT_AIRTEL . ')' : 'Moov Money (' . CONTACT_MOOV . ')';
        send_message($support['id'], 'SYSTEM', $tx['buyer_id'], "📷 DERNIÈRE ÉTAPE : vous avez déclaré un paiement de " . format_price($tx['total_paid_by_buyer']) . " via $methodLabel (réf. $reference) pour \"" . $tx['listing_title'] . "\". Envoyez ici la CAPTURE D'ÉCRAN de la transaction Mobile Money en cliquant sur le bouton 📎 ci-dessous. Notre équipe validera votre paiement après vérification.", true);
        $supportAdminId = get_support_admin_id();
        if ($supportAdminId) {
            notify($supportAdminId, 'PAYMENT_PROOF', '💳 Paiement déclaré — capture attendue', $user['full_name'] . ' a déclaré un paiement de ' . format_price($tx['total_paid_by_buyer']) . ' (réf. ' . $reference . '). Vérifiez la capture d\'écran dans la messagerie puis validez la transaction.', '/messages.php?c=' . $support['id']);
        }
        flash('✅ Paiement déclaré (réf. ' . $reference . ') ! DERNIÈRE ÉTAPE : envoyez la capture d\'écran de votre transaction Mobile Money ici, via le bouton 📎.');
        redirect('/messages.php?c=' . $support['id']);
    }

    flash('✅ Paiement déclaré avec succès ! Notre équipe vérifie votre paiement sous 24-48h. Référence : ' . $reference);
    redirect('/dashboard/transactions.php');
}

$pageTitle = 'Paiement sécurisé';
require_once __DIR__ . '/includes/header.php';
?>
<div class="container mx-auto px-4 py-8 max-w-4xl">
    <a href="/listing.php?id=<?= h($tx['lid']) ?>" class="inline-flex items-center text-gray-600 hover:text-kama-blue mb-6 font-medium">← Retour à l'annonce</a>

    <!-- Bandeau Sécurité -->
    <div class="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Paiement Sécurisé via KAPUCE.G</h3>
                <p class="text-gray-700 text-sm leading-relaxed mb-2">✅ Vous avez visité le bien et il vous plaît ? Effectuez le paiement à KAPUCE.G.</p>
                <p class="text-gray-700 text-sm leading-relaxed">🔒 KAPUCE.G prélève sa commission (<?= h($tx['commission_rate_client']) ?>%) et envoie le reste au propriétaire sous 24h.</p>
            </div>
        </div>
    </div>

    <!-- Info Annonce -->
    <div class="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-kama-blue to-blue-600 text-white px-6 py-4">
            <h3 class="font-bold text-lg flex items-center gap-3">🏠 Bien à <?= $tx['listing_category'] === 'SALE' ? 'Acheter' : 'Louer' ?></h3>
        </div>
        <div class="p-6">
            <h2 class="text-2xl font-bold mb-2"><?= h($tx['listing_title']) ?></h2>
            <p class="text-gray-600 mb-4"><?= h($tx['listing_address']) ?>, <?= h($tx['listing_city']) ?></p>

            <div class="space-y-3 mb-4">
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span class="text-gray-600">Prix annonce</span>
                    <span class="text-xl font-bold text-gray-900"><?= format_price($tx['amount']) ?></span>
                </div>
                <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span class="text-blue-700">Frais service KAPUCE.G (<?= h($tx['commission_rate_client']) ?>%)</span>
                    <span class="text-lg font-bold text-blue-700">+ <?= format_price($tx['commission_client']) ?></span>
                </div>
                <div class="flex justify-between items-center p-4 bg-gradient-to-r from-kama-gold/20 to-yellow-100 rounded-lg border-2 border-kama-gold">
                    <span class="text-gray-900 font-bold">TOTAL À PAYER</span>
                    <span class="text-2xl font-black text-kama-gold"><?= format_price($tx['total_paid_by_buyer']) ?></span>
                </div>
            </div>

            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-xs text-green-700 mb-1">ℹ️ Informations transparentes :</p>
                <p class="text-sm text-green-800">Le propriétaire recevra <strong><?= format_price($tx['seller_receives']) ?></strong> après prélèvement de sa commission (<?= h($tx['commission_rate_owner']) ?>%).</p>
            </div>
        </div>
    </div>

    <?php if ($tx['status'] !== 'PENDING_PAYMENT'): ?>
        <div class="bg-green-50 border border-green-200 rounded-2xl p-6 text-center text-green-800 font-semibold">
            Cette transaction est déjà : <?= tx_status_label($tx['status']) ?><br>
            <a href="/dashboard/transactions.php" class="text-kama-blue underline text-sm">Voir mes transactions</a>
        </div>
    <?php else: ?>

    <!-- Comment payer : 3 étapes -->
    <div class="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 class="font-bold text-lg text-gray-900 mb-4">Comment payer ? <span class="text-sm font-normal text-gray-400">(3 étapes simples)</span></h3>
        <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-slate-50 rounded-xl p-4">
                <div class="w-9 h-9 bg-gradient-to-br from-kama-blue to-blue-700 text-white rounded-full flex items-center justify-center font-black mb-2">1</div>
                <p class="text-sm text-gray-700"><strong>Envoyez le montant total</strong> par Mobile Money au numéro officiel KAPUCE.G ci-dessous (Airtel ou Moov).</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4">
                <div class="w-9 h-9 bg-gradient-to-br from-kama-gold to-yellow-600 text-white rounded-full flex items-center justify-center font-black mb-2">2</div>
                <p class="text-sm text-gray-700"><strong>Saisissez la référence</strong> de transaction reçue par SMS dans le formulaire ci-dessous.</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4">
                <div class="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-black mb-2">3</div>
                <p class="text-sm text-gray-700"><strong>Envoyez la capture d'écran</strong> de la transaction à KAPUCE.G via la messagerie (📎) — vous y serez redirigé automatiquement.</p>
            </div>
        </div>
    </div>

    <!-- Comptes Mobile Money officiels KAPUCE.G -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- Airtel Money -->
        <label class="block cursor-pointer">
            <input type="radio" name="methodPick" value="AIRTEL_MONEY" checked class="sr-only peer" onchange="document.getElementById('methodInput').value=this.value">
            <div class="rounded-2xl overflow-hidden border-2 border-red-200 peer-checked:border-red-500 peer-checked:shadow-xl hover:border-red-400 transition-all bg-white shadow-lg">
                <div class="bg-gradient-to-br from-red-500 to-red-600 text-white px-6 py-4 flex items-center gap-3">
                    <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                        <p class="text-xl font-black">Airtel Money</p>
                        <p class="text-red-100 text-sm">KAPUCE.G Officiel</p>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                        <div class="flex items-center gap-3">
                            <span class="text-gray-400">📞</span>
                            <span class="text-2xl font-black text-gray-900 tracking-wider">077 347 262</span>
                        </div>
                        <button type="button" onclick="copyNumber('<?= CONTACT_AIRTEL ?>', this)" class="text-kama-gold hover:bg-kama-gold/10 rounded-lg p-2 transition" title="Copier">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </label>

        <!-- Moov Money -->
        <label class="block cursor-pointer">
            <input type="radio" name="methodPick" value="MOOV_MONEY" class="sr-only peer" onchange="document.getElementById('methodInput').value=this.value">
            <div class="rounded-2xl overflow-hidden border-2 border-blue-200 peer-checked:border-blue-500 peer-checked:shadow-xl hover:border-blue-400 transition-all bg-white shadow-lg">
                <div class="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center gap-3">
                    <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                        <p class="text-xl font-black">Moov Money</p>
                        <p class="text-blue-100 text-sm">KAPUCE.G Officiel</p>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                        <div class="flex items-center gap-3">
                            <span class="text-gray-400">📞</span>
                            <span class="text-2xl font-black text-gray-900 tracking-wider">065 216 069</span>
                        </div>
                        <button type="button" onclick="copyNumber('<?= CONTACT_MOOV ?>', this)" class="text-kama-gold hover:bg-kama-gold/10 rounded-lg p-2 transition" title="Copier">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </label>
    </div>

    <!-- Formulaire de confirmation -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 class="font-bold text-lg flex items-center gap-2 mb-5"><span class="text-kama-gold">✓</span> Confirmer le Paiement</h3>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="hidden" name="method" id="methodInput" value="AIRTEL_MONEY">
            <div>
                <label class="block text-sm font-medium mb-2">Référence de Transaction (Code reçu par SMS) *</label>
                <input type="text" name="payment_reference" required placeholder="Ex: TXN123456789" class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Commentaire (optionnel)</label>
                <textarea name="comment" rows="3" placeholder="Informations supplémentaires..." class="w-full border border-gray-200 rounded-xl px-4 py-3"></textarea>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p class="text-sm text-yellow-900 flex items-start gap-2">
                    <span>⏰</span>
                    <span><strong>Validation sous 24-48h :</strong> après confirmation, vous serez redirigé vers la messagerie KAPUCE.G pour envoyer la <strong>capture d'écran de votre transaction</strong> (obligatoire). Le propriétaire recevra son argent sous 24h après validation.</span>
                </p>
            </div>
            <button class="w-full h-14 bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg hover:shadow-kama-gold/40 text-white font-bold text-lg rounded-xl transition-all">Confirmer le Paiement</button>
        </form>
    </div>

    <div id="copyToast" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-2xl z-50">Numéro copié !</div>
    <script>
    function copyNumber(num, btn) {
        navigator.clipboard.writeText(num).then(() => {
            const t = document.getElementById('copyToast');
            t.classList.remove('hidden');
            setTimeout(() => t.classList.add('hidden'), 2000);
        });
    }
    </script>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
