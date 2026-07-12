<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

$pdo = db();
$myListings = $pdo->prepare('SELECT COUNT(*) FROM listings WHERE owner_id = ?');
$myListings->execute([$user['id']]);
$nbListings = (int)$myListings->fetchColumn();

$pendingVisits = $pdo->prepare("SELECT COUNT(*) FROM visit_requests WHERE owner_id = ? AND status = 'PENDING'");
$pendingVisits->execute([$user['id']]);
$nbPendingVisits = (int)$pendingVisits->fetchColumn();

$myVisits = $pdo->prepare('SELECT COUNT(*) FROM visit_requests WHERE requester_id = ?');
$myVisits->execute([$user['id']]);
$nbMyVisits = (int)$myVisits->fetchColumn();

$txCount = $pdo->prepare('SELECT COUNT(*) FROM transactions WHERE buyer_id = ? OR seller_id = ?');
$txCount->execute([$user['id'], $user['id']]);
$nbTx = (int)$txCount->fetchColumn();

$pageTitle = 'Mon espace';
require_once __DIR__ . '/../includes/header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8">
        <div>
            <h1 class="text-2xl font-extrabold text-gray-900">Bonjour, <?= h($user['full_name']) ?> 👋</h1>
            <p class="text-sm text-gray-500">Rôle : <?= h($user['role']) ?> — Membre depuis <?= date('d/m/Y', strtotime($user['created_at'])) ?></p>
        </div>
        <a href="/dashboard/create-listing.php" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-bold text-center">+ Publier une annonce</a>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <a href="/dashboard/my-listings.php" class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div class="text-3xl font-extrabold text-brand-600"><?= $nbListings ?></div>
            <div class="text-sm text-gray-500 font-medium">Mes annonces</div>
        </a>
        <a href="/dashboard/visit-requests.php" class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition relative">
            <?php if ($nbPendingVisits): ?><span class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5"><?= $nbPendingVisits ?> nouv.</span><?php endif; ?>
            <div class="text-3xl font-extrabold text-amber-500"><?= $nbPendingVisits ?></div>
            <div class="text-sm text-gray-500 font-medium">Visites reçues (en attente)</div>
        </a>
        <a href="/dashboard/my-visits.php" class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div class="text-3xl font-extrabold text-blue-500"><?= $nbMyVisits ?></div>
            <div class="text-sm text-gray-500 font-medium">Mes demandes de visite</div>
        </a>
        <a href="/dashboard/transactions.php" class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div class="text-3xl font-extrabold text-purple-500"><?= $nbTx ?></div>
            <div class="text-sm text-gray-500 font-medium">Transactions</div>
        </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <a href="/messages.php" class="bg-gray-900 text-white rounded-xl p-6 hover:bg-gray-800 transition">
            <h3 class="font-bold text-lg mb-1">💬 Messagerie sécurisée</h3>
            <p class="text-sm text-gray-300">Échangez avec les propriétaires et clients en toute sécurité. <?= $unread > 0 ? "<strong class='text-red-400'>$unread message(s) non lu(s)</strong>" : '' ?></p>
        </a>
        <a href="/listings.php" class="bg-brand-600 text-white rounded-xl p-6 hover:bg-brand-700 transition">
            <h3 class="font-bold text-lg mb-1">🔍 Explorer les annonces</h3>
            <p class="text-sm text-green-100">Immobilier, véhicules et terrains partout au Gabon.</p>
        </a>
        <a href="/dashboard/profile.php" class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
            <h3 class="font-bold text-lg mb-1 text-gray-900">👤 Mon profil</h3>
            <p class="text-sm text-gray-500">Modifiez vos informations personnelles et votre mot de passe.</p>
        </a>
        <a href="/dashboard/settings.php" class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
            <h3 class="font-bold text-lg mb-1 text-gray-900">⚙️ Paramètres</h3>
            <p class="text-sm text-gray-500">Gérez vos préférences de notifications.</p>
        </a>
        <a href="/contact-support.php" class="md:col-span-2 bg-gradient-to-r from-kama-gold to-yellow-600 text-white rounded-xl p-6 hover:shadow-lg hover:shadow-kama-gold/30 transition">
            <h3 class="font-bold text-lg mb-1">🛟 Contacter KAPUCE.G</h3>
            <p class="text-sm text-yellow-100">Une question ? Un paiement à justifier (capture d'écran) ? Écrivez directement à notre équipe via la messagerie sécurisée.</p>
        </a>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
