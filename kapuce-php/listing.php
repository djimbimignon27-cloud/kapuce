<?php
require_once __DIR__ . '/includes/auth.php';

$id = $_GET['id'] ?? '';
$stmt = db()->prepare('SELECT l.*, u.full_name AS owner_name, u.created_at AS owner_since, u.transactions_count AS owner_tx FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = ?');
$stmt->execute([$id]);
$listing = $stmt->fetch();

if (!$listing) {
    flash('Annonce introuvable.', 'error');
    redirect('/listings.php');
}

$user = current_user();
$isOwner = $user && $user['id'] === $listing['owner_id'];

// --- POST : Demande de visite ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'request_visit') {
    if (!$user) { flash('Connectez-vous pour demander une visite.', 'error'); redirect('/login.php'); }
    check_csrf();
    if ($isOwner) { flash('Vous ne pouvez pas demander une visite de votre propre bien.', 'error'); redirect('/listing.php?id=' . urlencode($id)); }

    $exists = db()->prepare("SELECT COUNT(*) FROM visit_requests WHERE listing_id = ? AND requester_id = ? AND status = 'PENDING'");
    $exists->execute([$id, $user['id']]);
    if ($exists->fetchColumn()) {
        flash('Vous avez déjà une demande de visite en attente pour cette annonce.', 'error');
    } else {
        $msg = trim($_POST['message'] ?? '');
        $date = $_POST['proposed_date'] ?? null;
        db()->prepare('INSERT INTO visit_requests (id, listing_id, requester_id, owner_id, status, message, proposed_date) VALUES (?, ?, ?, ?, \'PENDING\', ?, ?)')
            ->execute([uuid(), $id, $user['id'], $listing['owner_id'], $msg ?: null, $date ?: null]);
        notify($listing['owner_id'], 'VISIT_REQUEST', 'Nouvelle demande de visite', $user['full_name'] . ' souhaite visiter "' . $listing['title'] . '"', '/dashboard/visit-requests.php');
        flash('✅ Demande de visite envoyée ! Le propriétaire va l\'examiner. Vous serez notifié dans votre espace.');
    }
    redirect('/listing.php?id=' . urlencode($id));
}

// --- POST : Initier le paiement (après visite acceptée) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'start_payment') {
    if (!$user) { redirect('/login.php'); }
    check_csrf();
    $v = db()->prepare("SELECT COUNT(*) FROM visit_requests WHERE listing_id = ? AND requester_id = ? AND status = 'ACCEPTED'");
    $v->execute([$id, $user['id']]);
    if (!$v->fetchColumn()) {
        flash('Vous devez d\'abord effectuer une visite acceptée par le propriétaire avant de payer.', 'error');
        redirect('/listing.php?id=' . urlencode($id));
    }
    $t = db()->prepare("SELECT id FROM transactions WHERE listing_id = ? AND buyer_id = ? AND status IN ('PENDING_PAYMENT','PAID','PROCESSING')");
    $t->execute([$id, $user['id']]);
    $existing = $t->fetch();
    if ($existing) { redirect('/pay.php?id=' . urlencode($existing['id'])); }

    $settings = get_settings();
    $rateClient = (float)$settings['commission_client'];
    $rateOwner = (float)$settings['commission_owner'];
    $cc = db()->prepare('SELECT custom_commission_rate FROM users WHERE id = ?');
    $cc->execute([$listing['owner_id']]);
    $custom = $cc->fetchColumn();
    if ($custom !== null && $custom !== false && $custom !== '') $rateOwner = (float)$custom;

    $amount = (int)$listing['price'];
    $commClient = (int)round($amount * $rateClient / 100);
    $commOwner = (int)round($amount * $rateOwner / 100);
    $txId = uuid();
    db()->prepare('INSERT INTO transactions (id, listing_id, buyer_id, seller_id, amount, commission_rate_client, commission_rate_owner, commission_client, commission_owner, total_paid_by_buyer, seller_receives, status, transaction_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'PENDING_PAYMENT\', ?)')
        ->execute([$txId, $id, $user['id'], $listing['owner_id'], $amount, $rateClient, $rateOwner, $commClient, $commOwner, $amount + $commClient, $amount - $commOwner, $listing['category'] === 'RENT' ? 'RENT' : 'SALE']);
    redirect('/pay.php?id=' . $txId);
}

// Incrémenter les vues
db()->prepare('UPDATE listings SET views_count = views_count + 1 WHERE id = ?')->execute([$id]);

$images = json_decode($listing['images'] ?? '[]', true) ?: [];
$details = json_decode($listing['details'] ?? '{}', true) ?: [];

// Statut de la visite de l'utilisateur courant
$myVisit = null;
if ($user && !$isOwner) {
    $v = db()->prepare('SELECT * FROM visit_requests WHERE listing_id = ? AND requester_id = ? ORDER BY created_at DESC LIMIT 1');
    $v->execute([$id, $user['id']]);
    $myVisit = $v->fetch();
}

// Favori ?
$isFav = false;
if ($user) {
    $f = db()->prepare('SELECT COUNT(*) FROM favorites WHERE user_id = ? AND listing_id = ?');
    $f->execute([$user['id'], $id]);
    $isFav = (bool)$f->fetchColumn();
}

// Notation du propriétaire + derniers avis
$ownerRating = user_rating($listing['owner_id']);
$stmtR = db()->prepare('SELECT r.*, u.full_name AS reviewer_name FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.reviewed_id = ? ORDER BY r.created_at DESC LIMIT 5');
$stmtR->execute([$listing['owner_id']]);
$ownerReviews = $stmtR->fetchAll();

$pageTitle = $listing['title'];
require_once __DIR__ . '/includes/header.php';

$detailLabels = [
    'surface' => 'Superficie (m²)', 'bedrooms' => 'Chambres', 'bathrooms' => 'Salles de bain', 'furnished' => 'Meublé',
    'condition' => 'État', 'floors' => 'Étages', 'parking' => 'Parking', 'year_built' => 'Année de construction',
    'brand' => 'Marque', 'model' => 'Modèle', 'year' => 'Année', 'mileage' => 'Kilométrage (km)', 'fuel' => 'Carburant',
    'transmission' => 'Transmission', 'color' => 'Couleur', 'seats' => 'Places',
    'topography' => 'Topographie', 'boundary_marked' => 'Terrain borné', 'zoning' => 'Zone', 'accessibility' => 'Accessibilité',
];
$valueLabels = [
    'FURNISHED' => 'Meublé', 'SEMI_FURNISHED' => 'Semi-meublé', 'UNFURNISHED' => 'Non meublé',
    'NEW' => 'Neuf', 'EXCELLENT' => 'Excellent', 'GOOD' => 'Bon', 'FAIR' => 'Correct', 'RENOVATE' => 'À rénover', 'FOR_PARTS' => 'Pour pièces',
    'PETROL' => 'Essence', 'DIESEL' => 'Diesel', 'ELECTRIC' => 'Électrique', 'HYBRID' => 'Hybride',
    'MANUAL' => 'Manuelle', 'AUTOMATIC' => 'Automatique', 'SEMI_AUTO' => 'Semi-automatique',
    'FLAT' => 'Plat', 'SLOPED' => 'En pente', 'HILLY' => 'Vallonné', 'MIXED' => 'Mixte',
    '1' => 'Oui', '0' => 'Non',
];
?>
<div class="container mx-auto max-w-7xl px-4 py-8">
    <a href="/listings.php" class="inline-flex items-center text-gray-600 hover:text-kama-blue mb-6 font-medium">← Retour aux annonces</a>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Colonne principale -->
        <div class="lg:col-span-2">
            <!-- Galerie -->
            <div class="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-6 relative">
                <?php if ($user && !$isOwner): ?>
                <button onclick="toggleFav('<?= h($id) ?>', this)" class="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:scale-110 transition" title="Favori">
                    <svg class="w-6 h-6 <?= $isFav ? 'text-red-500' : 'text-gray-400' ?>" fill="<?= $isFav ? 'currentColor' : 'none' ?>" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>
                <?php endif; ?>
                <?php if ($images): ?>
                <img id="mainImage" src="<?= h($images[0]['url']) ?>" class="w-full h-80 sm:h-96 object-cover" alt="<?= h($listing['title']) ?>">
                <?php if (count($images) > 1): ?>
                <div class="flex gap-2 p-3 overflow-x-auto">
                    <?php foreach ($images as $img): ?>
                    <img src="<?= h($img['url']) ?>" onclick="document.getElementById('mainImage').src=this.src" class="w-20 h-16 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-kama-gold">
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
                <?php else: ?>
                <div class="w-full h-80 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-gray-400 text-lg">📷 Aucune photo</div>
                <?php endif; ?>
            </div>

            <?php if ($listing['video_url']): ?>
            <div class="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-6 p-5">
                <h3 class="font-bold mb-3">🎥 Vidéo de présentation</h3>
                <video controls class="w-full rounded-xl max-h-96"><source src="<?= h($listing['video_url']) ?>"></video>
            </div>
            <?php endif; ?>

            <!-- Description -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                    <span class="bg-kama-gold/90 text-white text-xs font-bold px-3 py-1 rounded-full"><?= category_label($listing['category']) ?></span>
                    <span class="bg-kama-blue/10 text-kama-blue text-xs font-bold px-3 py-1 rounded-full"><?= type_label($listing['type']) ?></span>
                    <?php if ($listing['verified']): ?><span class="bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Vérifié par KAPUCE.G</span><?php endif; ?>
                </div>
                <h1 class="text-2xl md:text-3xl font-black text-gray-900 mb-1"><?= h($listing['title']) ?></h1>
                <p class="text-sm text-gray-500 mb-4"><span class="text-kama-gold">📍</span> <?= h($listing['city']) ?><?= $listing['neighborhood'] ? ' — ' . h($listing['neighborhood']) : '' ?></p>
                <p class="text-gray-700 whitespace-pre-line leading-relaxed"><?= h($listing['description']) ?></p>
            </div>

            <!-- Caractéristiques -->
            <?php if (array_filter($details)): ?>
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 class="font-bold text-lg mb-4">Caractéristiques</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <?php foreach ($details as $k => $v): if ($v === '' || $v === null) continue; ?>
                    <div class="bg-slate-50 rounded-xl p-3">
                        <div class="text-xs text-gray-400"><?= h($detailLabels[$k] ?? ucfirst($k)) ?></div>
                        <div class="font-semibold text-gray-800"><?= h($valueLabels[(string)$v] ?? $v) ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- Avis sur le propriétaire -->
            <?php if ($ownerReviews): ?>
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
                <h3 class="font-bold text-lg mb-4">⭐ Avis sur le propriétaire (<?= $ownerRating['count'] ?>)</h3>
                <div class="space-y-4">
                    <?php foreach ($ownerReviews as $rev): ?>
                    <div class="border-b border-gray-100 pb-3 last:border-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold text-sm"><?= h($rev['reviewer_name']) ?></span>
                            <span class="text-sm"><?= stars_html($rev['rating']) ?></span>
                            <span class="text-xs text-gray-400"><?= time_ago($rev['created_at']) ?></span>
                        </div>
                        <?php if ($rev['comment']): ?><p class="text-sm text-gray-600 italic">« <?= h($rev['comment']) ?> »</p><?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div class="text-3xl font-black text-kama-blue"><?= format_price($listing['price']) ?><?= $listing['category'] === 'RENT' ? '<span class="text-sm text-gray-400 font-normal">/mois</span>' : '' ?></div>
                <div class="text-xs text-gray-400 mt-1">👁 <?= (int)$listing['views_count'] ?> vues</div>
            </div>

            <!-- Propriétaire (contact masqué) -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 class="font-bold mb-3">Propriétaire</h3>
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-kama-blue to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg"><?= h(mb_strtoupper(mb_substr($listing['owner_name'], 0, 1))) ?></div>
                    <div>
                        <div class="font-semibold"><?= h($listing['owner_name']) ?></div>
                        <div class="text-xs text-gray-400">Membre depuis <?= date('m/Y', strtotime($listing['owner_since'])) ?></div>
                        <?php if ($ownerRating['count'] > 0): ?>
                        <div class="text-sm mt-0.5"><?= stars_html($ownerRating['avg']) ?> <span class="text-xs text-gray-500 font-semibold"><?= $ownerRating['avg'] ?>/5 (<?= $ownerRating['count'] ?> avis)</span></div>
                        <?php else: ?>
                        <div class="text-xs text-gray-400 mt-0.5">Pas encore d'avis</div>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 mb-4">
                    🛡️ <strong>Protection KAPUCE.G</strong> : les coordonnées (téléphone, email) sont masquées. Toute communication passe par notre messagerie sécurisée.
                </div>

                <?php if ($isOwner): ?>
                    <p class="text-sm text-gray-500 text-center">C'est votre annonce. <a href="/dashboard/my-listings.php" class="text-kama-blue font-semibold">Gérer</a></p>
                <?php elseif (!$user): ?>
                    <a href="/login.php" class="block w-full bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg text-white text-center py-3.5 rounded-xl font-bold transition-all">Se connecter pour demander une visite</a>
                <?php else: ?>
                    <?php if ($myVisit && $myVisit['status'] === 'PENDING'): ?>
                        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 text-center font-medium">⏳ Demande de visite en attente de réponse du propriétaire</div>
                    <?php elseif ($myVisit && $myVisit['status'] === 'ACCEPTED'): ?>
                        <div class="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 text-center font-medium mb-3">✅ Visite acceptée ! Discutez avec le propriétaire pour fixer le rendez-vous.</div>
                        <a href="/messages.php" class="block w-full bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg hover:shadow-kama-gold/40 text-white text-center py-3.5 rounded-xl font-bold mb-2 transition-all">💬 Contacter via Messagerie</a>
                        <form method="post">
                            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                            <input type="hidden" name="action" value="start_payment">
                            <button class="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/40 text-white rounded-xl font-bold text-lg transition-all">💰 <?= $listing['category'] === 'SALE' ? 'Acheter' : 'Louer' ?> ce Bien</button>
                        </form>
                    <?php else: ?>
                        <button onclick="document.getElementById('visitModal').classList.remove('hidden')" class="w-full bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg hover:shadow-kama-blue/30 text-white py-3.5 rounded-xl font-bold transition-all">📅 Demander une visite</button>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <div class="bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue text-white rounded-2xl p-5 text-sm shadow-lg">
                <h4 class="font-bold mb-2">🔒 Paiement 100% sécurisé</h4>
                <p class="text-blue-100 text-xs leading-relaxed">Votre argent est conservé par KAPUCE.G (séquestre) et n'est versé au propriétaire qu'après validation. Paiement par Airtel Money & Moov Money.</p>
            </div>
        </div>
    </div>
</div>

<!-- Modal demande de visite -->
<div id="visitModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 class="font-bold text-lg mb-4">📅 Demander une visite</h3>
        <form method="post">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="hidden" name="action" value="request_visit">
            <label class="block text-sm font-medium text-gray-700 mb-1">Date souhaitée (optionnel)</label>
            <input type="datetime-local" name="proposed_date" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Message au propriétaire (optionnel)</label>
            <textarea name="message" rows="3" placeholder="Bonjour, je suis intéressé(e) par votre bien..." class="w-full border border-gray-200 rounded-xl px-3 py-2.5 mb-4"></textarea>
            <div class="flex gap-2">
                <button type="button" onclick="document.getElementById('visitModal').classList.add('hidden')" class="flex-1 border border-gray-300 rounded-xl py-2.5 font-semibold text-gray-600">Annuler</button>
                <button class="flex-1 bg-gradient-to-r from-kama-blue to-blue-600 text-white rounded-xl py-2.5 font-bold">Envoyer</button>
            </div>
        </form>
    </div>
</div>
<?php if ($user): ?>
<script>
async function toggleFav(listingId, btn) {
    try {
        const r = await fetch('/api/favorites.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({listing_id: listingId}) });
        const data = await r.json();
        const svg = btn.querySelector('svg');
        if (data.favorited) {
            svg.classList.add('text-red-500');
            svg.classList.remove('text-gray-400');
            svg.setAttribute('fill', 'currentColor');
        } else {
            svg.classList.remove('text-red-500');
            svg.classList.add('text-gray-400');
            svg.setAttribute('fill', 'none');
        }
    } catch (e) { console.error(e); }
}
</script>
<?php endif; ?>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
