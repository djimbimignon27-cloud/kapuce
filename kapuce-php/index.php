<?php
$pageTitle = 'Accueil';
require_once __DIR__ . '/includes/header.php';

$featured = db()->query("SELECT l.*, u.full_name AS owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.status = 'ACTIVE' ORDER BY l.featured DESC, l.created_at DESC LIMIT 8")->fetchAll();
$stats = [
    'listings' => db()->query("SELECT COUNT(*) FROM listings WHERE status = 'ACTIVE'")->fetchColumn(),
    'users' => db()->query('SELECT COUNT(*) FROM users')->fetchColumn(),
];
?>
<!-- HERO -->
<section class="relative bg-gray-900 text-white">
    <div class="absolute inset-0 bg-cover bg-center opacity-40" style="background-image:url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=60')"></div>
    <div class="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 text-center">
        <h1 class="text-3xl sm:text-5xl font-extrabold mb-4">Trouvez votre bien au Gabon<br><span class="text-brand-500">en toute sécurité</span></h1>
        <p class="text-gray-200 max-w-2xl mx-auto mb-8">Immobilier, véhicules et terrains — location et vente. Messagerie sécurisée, paiement protégé par séquestre Mobile Money.</p>
        <form action="/listings.php" method="get" class="bg-white rounded-xl p-3 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto shadow-xl">
            <select name="type" class="rounded-lg border-gray-200 text-gray-700 px-3 py-2.5 border">
                <option value="">Tous les biens</option>
                <option value="HOUSE">Immobilier</option>
                <option value="CAR">Véhicules</option>
                <option value="LAND">Terrains</option>
            </select>
            <select name="category" class="rounded-lg border-gray-200 text-gray-700 px-3 py-2.5 border">
                <option value="">Louer ou Acheter</option>
                <option value="RENT">Location</option>
                <option value="SALE">Achat</option>
            </select>
            <input type="text" name="q" placeholder="Ville, quartier, mot-clé..." class="flex-1 rounded-lg border-gray-200 text-gray-700 px-3 py-2.5 border">
            <button class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-bold">Rechercher</button>
        </form>
        <div class="flex justify-center gap-10 mt-10 text-sm">
            <div><div class="text-2xl font-extrabold text-brand-500"><?= (int)$stats['listings'] ?></div>Annonces actives</div>
            <div><div class="text-2xl font-extrabold text-brand-500"><?= (int)$stats['users'] ?></div>Membres</div>
            <div><div class="text-2xl font-extrabold text-brand-500">100%</div>Sécurisé</div>
        </div>
    </div>
</section>

<!-- CATEGORIES -->
<section class="max-w-7xl mx-auto px-4 py-12">
    <h2 class="text-2xl font-extrabold text-gray-900 mb-6">Explorer par catégorie</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <a href="/listings.php?type=HOUSE" class="group relative rounded-xl overflow-hidden h-44">
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=60" class="w-full h-full object-cover group-hover:scale-105 transition" alt="Immobilier">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4"><span class="text-white font-bold text-lg">🏠 Immobilier</span></div>
        </a>
        <a href="/listings.php?type=CAR" class="group relative rounded-xl overflow-hidden h-44">
            <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=60" class="w-full h-full object-cover group-hover:scale-105 transition" alt="Véhicules">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4"><span class="text-white font-bold text-lg">🚗 Véhicules</span></div>
        </a>
        <a href="/listings.php?type=LAND" class="group relative rounded-xl overflow-hidden h-44">
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=60" class="w-full h-full object-cover group-hover:scale-105 transition" alt="Terrains">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4"><span class="text-white font-bold text-lg">🌿 Terrains</span></div>
        </a>
    </div>
</section>

<!-- ANNONCES RÉCENTES -->
<section class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-extrabold text-gray-900">Annonces récentes</h2>
        <a href="/listings.php" class="text-brand-600 font-semibold hover:underline">Voir tout →</a>
    </div>
    <?php if (!$featured): ?>
        <div class="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">Aucune annonce pour le moment. <a href="/register.php" class="text-brand-600 font-semibold">Publiez la première !</a></div>
    <?php else: ?>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <?php foreach ($featured as $l): ?>
        <a href="/listing.php?id=<?= h($l['id']) ?>" class="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition group">
            <div class="relative h-44">
                <img src="<?= h(listing_first_image($l)) ?>" class="w-full h-full object-cover" alt="<?= h($l['title']) ?>">
                <span class="absolute top-2 left-2 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded"><?= category_label($l['category']) ?></span>
                <?php if ($l['verified']): ?><span class="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">✓ Vérifié</span><?php endif; ?>
            </div>
            <div class="p-4">
                <div class="text-xs text-gray-400 mb-1"><?= type_label($l['type']) ?> • <?= h($l['city']) ?></div>
                <h3 class="font-bold text-gray-900 truncate group-hover:text-brand-600"><?= h($l['title']) ?></h3>
                <div class="text-brand-600 font-extrabold mt-2"><?= format_price($l['price']) ?><?= $l['category'] === 'RENT' ? '<span class="text-xs text-gray-400 font-normal">/mois</span>' : '' ?></div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</section>

<!-- COMMENT ÇA MARCHE -->
<section class="bg-white border-y border-gray-200 py-14 mt-8">
    <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-2xl font-extrabold text-center text-gray-900 mb-10">Comment ça marche ?</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div><div class="w-14 h-14 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">1</div><h3 class="font-bold mb-1">Trouvez votre bien</h3><p class="text-sm text-gray-500">Parcourez les annonces vérifiées</p></div>
            <div><div class="w-14 h-14 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">2</div><h3 class="font-bold mb-1">Demandez une visite</h3><p class="text-sm text-gray-500">Le propriétaire accepte votre demande</p></div>
            <div><div class="w-14 h-14 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">3</div><h3 class="font-bold mb-1">Discutez en sécurité</h3><p class="text-sm text-gray-500">Via notre messagerie protégée anti-fraude</p></div>
            <div><div class="w-14 h-14 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">4</div><h3 class="font-bold mb-1">Payez via KAPUCE.G</h3><p class="text-sm text-gray-500">Paiement séquestre Mobile Money sécurisé</p></div>
        </div>
    </div>
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
