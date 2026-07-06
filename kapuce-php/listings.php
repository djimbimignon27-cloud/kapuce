<?php
$pageTitle = 'Annonces';
require_once __DIR__ . '/includes/header.php';

$type = $_GET['type'] ?? '';
$category = $_GET['category'] ?? '';
$city = $_GET['city'] ?? '';
$q = trim($_GET['q'] ?? '');
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

$cities = ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou', 'Akanda', 'Owendo', 'Ntoum'];
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6">Annonces <?= $type ? '— ' . type_label($type) : '' ?></h1>

    <form method="get" class="bg-white rounded-xl border border-gray-200 p-4 mb-8 grid grid-cols-2 md:grid-cols-6 gap-3">
        <select name="type" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous types</option>
            <option value="HOUSE" <?= $type === 'HOUSE' ? 'selected' : '' ?>>Immobilier</option>
            <option value="CAR" <?= $type === 'CAR' ? 'selected' : '' ?>>Véhicules</option>
            <option value="LAND" <?= $type === 'LAND' ? 'selected' : '' ?>>Terrains</option>
        </select>
        <select name="category" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Location & Vente</option>
            <option value="RENT" <?= $category === 'RENT' ? 'selected' : '' ?>>Location</option>
            <option value="SALE" <?= $category === 'SALE' ? 'selected' : '' ?>>Vente</option>
        </select>
        <select name="city" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Toutes villes</option>
            <?php foreach ($cities as $c): ?><option value="<?= $c ?>" <?= $city === $c ? 'selected' : '' ?>><?= $c ?></option><?php endforeach; ?>
        </select>
        <input type="number" name="min_price" placeholder="Prix min" value="<?= $minPrice ?: '' ?>" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <input type="number" name="max_price" placeholder="Prix max" value="<?= $maxPrice ?: '' ?>" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <button class="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-bold">Filtrer</button>
        <input type="hidden" name="q" value="<?= h($q) ?>">
    </form>

    <?php if (!$listings): ?>
        <div class="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <div class="text-4xl mb-3">🔍</div>
            <p class="text-gray-500">Aucune annonce ne correspond à vos critères.</p>
        </div>
    <?php else: ?>
    <p class="text-sm text-gray-500 mb-4"><?= count($listings) ?> annonce(s) trouvée(s)</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <?php foreach ($listings as $l): ?>
        <a href="/listing.php?id=<?= h($l['id']) ?>" class="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition group">
            <div class="relative h-44">
                <img src="<?= h(listing_first_image($l)) ?>" class="w-full h-full object-cover" alt="<?= h($l['title']) ?>">
                <span class="absolute top-2 left-2 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded"><?= category_label($l['category']) ?></span>
                <?php if ($l['verified']): ?><span class="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">✓ Vérifié</span><?php endif; ?>
            </div>
            <div class="p-4">
                <div class="text-xs text-gray-400 mb-1"><?= type_label($l['type']) ?> • <?= h($l['city']) ?><?= $l['neighborhood'] ? ' • ' . h($l['neighborhood']) : '' ?></div>
                <h3 class="font-bold text-gray-900 truncate group-hover:text-brand-600"><?= h($l['title']) ?></h3>
                <div class="text-brand-600 font-extrabold mt-2"><?= format_price($l['price']) ?><?= $l['category'] === 'RENT' ? '<span class="text-xs text-gray-400 font-normal">/mois</span>' : '' ?></div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
