<?php
require_once __DIR__ . '/includes/auth.php';

$type = $_GET['type'] ?? '';
$category = $_GET['category'] ?? '';
$city = $_GET['city'] ?? '';
$q = trim($_GET['q'] ?? ($_GET['search'] ?? ''));
$minPrice = (int)($_GET['min_price'] ?? 0);
$maxPrice = (int)($_GET['max_price'] ?? 0);

$sql = "SELECT l.*, u.full_name AS owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.status = 'ACTIVE'";
$params = [];
if (in_array($type, ['HOUSE', 'LAND', 'CAR'])) { $sql .= ' AND l.type = ?'; $params[] = $type; }
if (in_array($category, ['RENT', 'SALE'])) { $sql .= ' AND l.category = ?'; $params[] = $category; }
if ($city) { $sql .= ' AND l.city = ?'; $params[] = $city; }
if ($q) { $sql .= ' AND (l.title LIKE ? OR l.description LIKE ? OR l.city LIKE ? OR l.neighborhood LIKE ?)'; $like = "%$q%"; array_push($params, $like, $like, $like, $like); }
if ($minPrice > 0) { $sql .= ' AND l.price >= ?'; $params[] = $minPrice; }
if ($maxPrice > 0) { $sql .= ' AND l.price <= ?'; $params[] = $maxPrice; }
$sql .= ' ORDER BY l.featured DESC, l.created_at DESC LIMIT 60';
$stmt = db()->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();

// Favoris de l'utilisateur courant
$user = current_user();
$myFavs = [];
if ($user) {
    $f = db()->prepare('SELECT listing_id FROM favorites WHERE user_id = ?');
    $f->execute([$user['id']]);
    foreach ($f->fetchAll() as $row) $myFavs[$row['listing_id']] = true;
}

$cities = ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou', 'Akanda', 'Owendo', 'Ntoum'];
$DEMO_IMAGES = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
    'https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
];

$pageTitle = 'Annonces';
require_once __DIR__ . '/includes/header.php';
?>
<div class="container mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
        <span class="inline-flex items-center bg-kama-gold/10 text-kama-gold border border-kama-gold/30 mb-3 px-4 py-1 rounded-full text-sm">🔍 Recherche</span>
        <h1 class="text-3xl md:text-4xl font-black text-gray-900">Annonces <?= $type ? '— ' . type_label($type) : '' ?></h1>
    </div>

    <form method="get" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-8 grid grid-cols-2 md:grid-cols-6 gap-3">
        <select name="type" class="border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
            <option value="">Tous types</option>
            <option value="HOUSE" <?= $type === 'HOUSE' ? 'selected' : '' ?>>🏠 Immobilier</option>
            <option value="CAR" <?= $type === 'CAR' ? 'selected' : '' ?>>🚗 Véhicules</option>
            <option value="LAND" <?= $type === 'LAND' ? 'selected' : '' ?>>📍 Terrains</option>
        </select>
        <select name="category" class="border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
            <option value="">Vente & Location</option>
            <option value="RENT" <?= $category === 'RENT' ? 'selected' : '' ?>>Location</option>
            <option value="SALE" <?= $category === 'SALE' ? 'selected' : '' ?>>Vente</option>
        </select>
        <select name="city" class="border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
            <option value="">Toutes villes</option>
            <?php foreach ($cities as $c): ?><option value="<?= $c ?>" <?= $city === $c ? 'selected' : '' ?>><?= $c ?></option><?php endforeach; ?>
        </select>
        <input type="number" name="min_price" placeholder="Prix min" value="<?= $minPrice ?: '' ?>" class="border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
        <input type="number" name="max_price" placeholder="Prix max" value="<?= $maxPrice ?: '' ?>" class="border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
        <button class="bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg text-white rounded-xl px-4 py-2.5 text-sm font-bold">Filtrer</button>
        <input type="hidden" name="q" value="<?= h($q) ?>">
    </form>

    <?php if (!$listings): ?>
        <div class="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
            <div class="w-24 h-24 bg-gradient-to-br from-kama-gold/10 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔍</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Aucune annonce trouvée</h3>
            <p class="text-gray-500">Modifiez vos critères de recherche.</p>
        </div>
    <?php else: ?>
    <p class="text-sm text-gray-500 mb-4"><?= count($listings) ?> annonce(s) trouvée(s)</p>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <?php foreach ($listings as $i => $l): $images = json_decode($l['images'] ?? '[]', true) ?: []; $img = !empty($images[0]['url']) ? $images[0]['url'] : $DEMO_IMAGES[$i % 4]; ?>
        <div class="group bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-lg rounded-2xl overflow-hidden relative">
            <?php if ($user): ?>
            <button onclick="toggleFav('<?= h($l['id']) ?>', this)" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition" title="Favori">
                <svg class="w-5 h-5 <?= isset($myFavs[$l['id']]) ? 'text-red-500 fill-red-500' : 'text-gray-400' ?>" fill="<?= isset($myFavs[$l['id']]) ? 'currentColor' : 'none' ?>" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <?php endif; ?>
            <a href="/listing.php?id=<?= h($l['id']) ?>" class="block">
                <div class="aspect-[4/3] relative overflow-hidden">
                    <img src="<?= h($img) ?>" alt="<?= h($l['title']) ?>" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <?php if ($l['verified']): ?><span class="absolute top-3 left-3 inline-flex items-center bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">✓ Vérifié</span><?php endif; ?>
                    <span class="absolute top-12 left-3 bg-kama-gold/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full"><?= $l['category'] === 'SALE' ? 'Vente' : 'Location' ?></span>
                    <div class="absolute bottom-3 left-3 right-3">
                        <p class="text-xl font-bold text-white drop-shadow-lg"><?= format_price($l['price']) ?><?= $l['category'] === 'RENT' ? '<span class="text-xs font-normal">/mois</span>' : '' ?></p>
                    </div>
                    <div class="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 text-white text-xs">👁 <?= (int)$l['views_count'] ?></div>
                </div>
                <div class="p-5">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="p-1.5 bg-kama-blue/10 rounded-lg text-sm"><?= $l['type'] === 'HOUSE' ? '🏠' : ($l['type'] === 'CAR' ? '🚗' : '📍') ?></span>
                        <span class="text-xs text-kama-blue font-semibold uppercase"><?= type_label($l['type']) ?></span>
                    </div>
                    <h3 class="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-kama-blue transition-colors"><?= h($l['title']) ?></h3>
                    <div class="flex items-center text-gray-500 text-sm">
                        <span class="text-kama-gold mr-1.5">📍</span>
                        <span class="truncate"><?= h($l['city']) ?><?= $l['neighborhood'] ? ' • ' . h($l['neighborhood']) : '' ?></span>
                    </div>
                </div>
                <div class="h-1 bg-gradient-to-r from-kama-blue via-kama-gold to-kama-blue transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </a>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php if ($user): ?>
<script>
async function toggleFav(listingId, btn) {
    try {
        const r = await fetch('/api/favorites.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({listing_id: listingId}) });
        const data = await r.json();
        const svg = btn.querySelector('svg');
        if (data.favorited) {
            svg.classList.add('text-red-500', 'fill-red-500');
            svg.classList.remove('text-gray-400');
            svg.setAttribute('fill', 'currentColor');
        } else {
            svg.classList.remove('text-red-500', 'fill-red-500');
            svg.classList.add('text-gray-400');
            svg.setAttribute('fill', 'none');
        }
    } catch (e) { console.error(e); }
}
</script>
<?php endif; ?>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
