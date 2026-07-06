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
        flash('✅ Demande de visite envoyée ! Le propriétaire va l\'examiner. Vous serez notifié dans votre espace.');
    }
    redirect('/listing.php?id=' . urlencode($id));
}

// --- POST : Initier le paiement (après visite acceptée) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'start_payment') {
    if (!$user) { redirect('/login.php'); }
    check_csrf();
    // Vérifier qu'une visite a été acceptée
    $v = db()->prepare("SELECT COUNT(*) FROM visit_requests WHERE listing_id = ? AND requester_id = ? AND status = 'ACCEPTED'");
    $v->execute([$id, $user['id']]);
    if (!$v->fetchColumn()) {
        flash('Vous devez d\'abord effectuer une visite acceptée par le propriétaire avant de payer.', 'error');
        redirect('/listing.php?id=' . urlencode($id));
    }
    // Transaction existante en attente ?
    $t = db()->prepare("SELECT id FROM transactions WHERE listing_id = ? AND buyer_id = ? AND status IN ('PENDING_PAYMENT','PAID','PROCESSING')");
    $t->execute([$id, $user['id']]);
    $existing = $t->fetch();
    if ($existing) { redirect('/pay.php?id=' . urlencode($existing['id'])); }

    $settings = get_settings();
    $rateClient = (float)$settings['commission_client'];
    $rateOwner = (float)$settings['commission_owner'];
    // Commission personnalisée du propriétaire si définie
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
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Colonne principale -->
        <div class="lg:col-span-2">
            <!-- Galerie -->
            <div class="bg-white rounded-xl overflow-hidden border border-gray-200 mb-6">
                <?php if ($images): ?>
                <img id="mainImage" src="<?= h($images[0]['url']) ?>" class="w-full h-80 sm:h-96 object-cover" alt="<?= h($listing['title']) ?>">
                <?php if (count($images) > 1): ?>
                <div class="flex gap-2 p-3 overflow-x-auto">
                    <?php foreach ($images as $img): ?>
                    <img src="<?= h($img['url']) ?>" onclick="document.getElementById('mainImage').src=this.src" class="w-20 h-16 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-brand-500">
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
                <?php else: ?>
                <div class="w-full h-80 bg-gray-100 flex items-center justify-center text-gray-400">Aucune photo</div>
                <?php endif; ?>
            </div>

            <?php if ($listing['video_url']): ?>
            <div class="bg-white rounded-xl overflow-hidden border border-gray-200 mb-6 p-4">
                <h3 class="font-bold mb-3">🎥 Vidéo de présentation</h3>
                <video controls class="w-full rounded-lg max-h-96"><source src="<?= h($listing['video_url']) ?>"></video>
            </div>
            <?php endif; ?>

            <!-- Description -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                    <span class="bg-brand-100 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full"><?= category_label($listing['category']) ?></span>
                    <span class="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full"><?= type_label($listing['type']) ?></span>
                    <?php if ($listing['verified']): ?><span class="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">✓ Vérifié par KAPUCE.G</span><?php endif; ?>
                </div>
                <h1 class="text-2xl font-extrabold text-gray-900 mb-1"><?= h($listing['title']) ?></h1>
                <p class="text-sm text-gray-500 mb-4">📍 <?= h($listing['city']) ?><?= $listing['neighborhood'] ? ' — ' . h($listing['neighborhood']) : '' ?></p>
                <p class="text-gray-700 whitespace-pre-line"><?= h($listing['description']) ?></p>
            </div>

            <!-- Caractéristiques -->
            <?php if (array_filter($details)): ?>
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="font-bold text-lg mb-4">Caractéristiques</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <?php foreach ($details as $k => $v): if ($v === '' || $v === null) continue; ?>
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="text-xs text-gray-400"><?= h($detailLabels[$k] ?? ucfirst($k)) ?></div>
                        <div class="font-semibold text-gray-800"><?= h($valueLabels[(string)$v] ?? $v) ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="text-3xl font-extrabold text-brand-600"><?= format_price($listing['price']) ?><?= $listing['category'] === 'RENT' ? '<span class="text-sm text-gray-400 font-normal">/mois</span>' : '' ?></div>
                <div class="text-xs text-gray-400 mt-1"><?= (int)$listing['views_count'] ?> vues</div>
            </div>

            <!-- Propriétaire (contact masqué) -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="font-bold mb-3">Propriétaire</h3>
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-11 h-11 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-lg"><?= h(mb_strtoupper(mb_substr($listing['owner_name'], 0, 1))) ?></div>
                    <div>
                        <div class="font-semibold"><?= h($listing['owner_name']) ?></div>
                        <div class="text-xs text-gray-400">Membre depuis <?= date('m/Y', strtotime($listing['owner_since'])) ?></div>
                    </div>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
                    🛡️ <strong>Protection KAPUCE.G</strong> : les coordonnées (téléphone, email) sont masquées. Toute communication passe par notre messagerie sécurisée.
                </div>

                <?php if ($isOwner): ?>
                    <p class="text-sm text-gray-500 text-center">C'est votre annonce. <a href="/dashboard/my-listings.php" class="text-brand-600 font-semibold">Gérer</a></p>
                <?php elseif (!$user): ?>
                    <a href="/login.php" class="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center py-3 rounded-lg font-bold">Se connecter pour demander une visite</a>
                <?php else: ?>
                    <?php if ($myVisit && $myVisit['status'] === 'PENDING'): ?>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 text-center font-medium">⏳ Demande de visite en attente de réponse du propriétaire</div>
                    <?php elseif ($myVisit && $myVisit['status'] === 'ACCEPTED'): ?>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 text-center font-medium mb-3">✅ Visite acceptée ! Discutez avec le propriétaire pour fixer le rendez-vous.</div>
                        <a href="/messages.php" class="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center py-3 rounded-lg font-bold mb-2">💬 Ouvrir la messagerie</a>
                        <form method="post">
                            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                            <input type="hidden" name="action" value="start_payment">
                            <button class="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-bold">💰 Payer via KAPUCE.G (sécurisé)</button>
                        </form>
                    <?php else: ?>
                        <button onclick="document.getElementById('visitModal').classList.remove('hidden')" class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-bold">📅 Demander une visite</button>
                    <?php endif; ?>
                <?php endif; ?>
            </div>

            <div class="bg-gray-900 text-white rounded-xl p-5 text-sm">
                <h4 class="font-bold mb-2">🔒 Paiement 100% sécurisé</h4>
                <p class="text-gray-300 text-xs">Votre argent est conservé par KAPUCE.G (séquestre) et n'est versé au propriétaire qu'après validation. Paiement par Airtel Money & Moov Money.</p>
            </div>
        </div>
    </div>
</div>

<!-- Modal demande de visite -->
<div id="visitModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h3 class="font-bold text-lg mb-4">📅 Demander une visite</h3>
        <form method="post">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="hidden" name="action" value="request_visit">
            <label class="block text-sm font-medium text-gray-700 mb-1">Date souhaitée (optionnel)</label>
            <input type="datetime-local" name="proposed_date" class="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Message au propriétaire (optionnel)</label>
            <textarea name="message" rows="3" placeholder="Bonjour, je suis intéressé(e) par votre bien..." class="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4"></textarea>
            <div class="flex gap-2">
                <button type="button" onclick="document.getElementById('visitModal').classList.add('hidden')" class="flex-1 border border-gray-300 rounded-lg py-2.5 font-semibold text-gray-600">Annuler</button>
                <button class="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2.5 font-bold">Envoyer</button>
            </div>
        </form>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
