<?php
require_once __DIR__ . '/includes/auth.php';
$user = require_login();

$stmt = db()->prepare("SELECT l.*, f.created_at AS fav_at FROM favorites f JOIN listings l ON l.id = f.listing_id WHERE f.user_id = ? ORDER BY f.created_at DESC");
$stmt->execute([$user['id']]);
$listings = $stmt->fetchAll();

$pageTitle = 'Mes favoris';
require_once __DIR__ . '/includes/header.php';
?>
<div class="container mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
        <span class="inline-flex items-center bg-red-50 text-red-500 border border-red-200 mb-3 px-4 py-1 rounded-full text-sm">❤️ Favoris</span>
        <h1 class="text-3xl md:text-4xl font-black text-gray-900">Mes annonces favorites</h1>
    </div>

    <?php if (!$listings): ?>
        <div class="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
            <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">💔</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Aucun favori</h3>
            <p class="text-gray-500 mb-8">Cliquez sur le cœur d'une annonce pour la sauvegarder ici.</p>
            <a href="/listings.php" class="inline-flex bg-gradient-to-r from-kama-blue to-blue-600 text-white px-8 py-3 rounded-xl font-bold">Explorer les annonces</a>
        </div>
    <?php else: ?>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <?php foreach ($listings as $l): ?>
        <div class="group bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-lg rounded-2xl overflow-hidden relative">
            <button onclick="removeFav('<?= h($l['id']) ?>', this)" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition" title="Retirer des favoris">
                <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <a href="/listing.php?id=<?= h($l['id']) ?>" class="block">
                <div class="aspect-[4/3] relative overflow-hidden">
                    <img src="<?= h(listing_first_image($l)) ?>" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="<?= h($l['title']) ?>">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <span class="absolute top-3 left-3 bg-kama-gold/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full"><?= category_label($l['category']) ?></span>
                    <div class="absolute bottom-3 left-3">
                        <p class="text-xl font-bold text-white drop-shadow-lg"><?= format_price($l['price']) ?></p>
                    </div>
                </div>
                <div class="p-5">
                    <div class="text-xs text-kama-blue font-semibold uppercase mb-2"><?= type_label($l['type']) ?> • <?= h($l['city']) ?></div>
                    <h3 class="font-bold text-lg line-clamp-2 text-gray-900 group-hover:text-kama-blue transition-colors"><?= h($l['title']) ?></h3>
                    <?php if ($l['status'] !== 'ACTIVE'): ?><span class="inline-block mt-2 text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded"><?= status_label($l['status']) ?></span><?php endif; ?>
                </div>
            </a>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<script>
async function removeFav(listingId, btn) {
    try {
        await fetch('/api/favorites.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({listing_id: listingId}) });
        btn.closest('.group').remove();
    } catch (e) { console.error(e); }
}
</script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
