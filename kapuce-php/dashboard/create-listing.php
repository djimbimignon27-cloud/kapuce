<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/cloudinary.php';
$user = require_login();

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = (int)($_POST['price'] ?? 0);
    $type = in_array($_POST['type'] ?? '', ['HOUSE', 'LAND', 'CAR']) ? $_POST['type'] : '';
    $subCategory = trim($_POST['sub_category'] ?? '');
    $category = in_array($_POST['category'] ?? '', ['RENT', 'SALE']) ? $_POST['category'] : '';
    $city = trim($_POST['city'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $neighborhood = trim($_POST['neighborhood'] ?? '');

    // Détails selon le type
    $detailKeys = [
        'HOUSE' => ['surface', 'bedrooms', 'bathrooms', 'furnished', 'condition', 'floors', 'parking'],
        'CAR' => ['brand', 'model', 'year', 'mileage', 'fuel', 'transmission', 'color', 'seats'],
        'LAND' => ['surface', 'topography', 'boundary_marked', 'zoning'],
    ];
    $details = [];
    foreach (($detailKeys[$type] ?? []) as $k) {
        $v = trim($_POST['d_' . $k] ?? '');
        if ($v !== '') $details[$k] = $v;
    }

    if (mb_strlen($title) < 5) $error = 'Le titre doit contenir au moins 5 caractères.';
    elseif (mb_strlen($description) < 20) $error = 'La description doit contenir au moins 20 caractères.';
    elseif ($price <= 0) $error = 'Prix invalide.';
    elseif (!$type || !$category || !$city || !$address) $error = 'Veuillez remplir tous les champs obligatoires.';
    else {
        // --- Upload photos (max 5) ---
        $images = [];
        if (!empty($_FILES['photos']['name'][0])) {
            $count = count($_FILES['photos']['name']);
            if ($count > MAX_PHOTOS) {
                $error = 'Maximum ' . MAX_PHOTOS . ' photos autorisées.';
            } else {
                for ($i = 0; $i < $count; $i++) {
                    if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) continue;
                    $up = cloudinary_upload($_FILES['photos']['tmp_name'][$i], 'image');
                    if ($up) $images[] = ['url' => $up['url'], 'public_id' => $up['public_id'], 'is_primary' => $i === 0];
                }
            }
        }
        // --- Upload vidéo (max 1) ---
        $videoUrl = null;
        if (!$error && !empty($_FILES['video']['name']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
            $up = cloudinary_upload($_FILES['video']['tmp_name'], 'video');
            if ($up) $videoUrl = $up['url'];
        }

        if (!$error) {
            $id = uuid();
            db()->prepare('INSERT INTO listings (id, owner_id, title, description, price, type, sub_category, category, city, address, neighborhood, details, images, video_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'PENDING\')')
                ->execute([$id, $user['id'], $title, $description, $price, $type, $subCategory ?: $type, $category, $city, $address, $neighborhood ?: null, json_encode($details, JSON_UNESCAPED_UNICODE), json_encode($images), $videoUrl]);
            flash('✅ Annonce créée ! Elle sera visible après validation par l\'équipe KAPUCE.G.');
            redirect('/dashboard/my-listings.php');
        }
    }
}

$pageTitle = 'Publier une annonce';
require_once __DIR__ . '/../includes/header.php';
$cities = ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou', 'Akanda', 'Owendo', 'Ntoum'];
?>
<div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-6">Publier une annonce</h1>
    <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>

    <form method="post" enctype="multipart/form-data" class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <input type="hidden" name="csrf" value="<?= csrf_token() ?>">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type de bien *</label>
                <select name="type" id="typeSelect" required onchange="showDetails()" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
                    <option value="">-- Choisir --</option>
                    <option value="HOUSE">Immobilier (maison, appartement...)</option>
                    <option value="CAR">Véhicule</option>
                    <option value="LAND">Terrain</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Transaction *</label>
                <select name="category" required class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
                    <option value="RENT">Location</option>
                    <option value="SALE">Vente</option>
                </select>
            </div>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sous-catégorie</label>
            <select name="sub_category" id="subCategory" class="w-full border border-gray-200 rounded-lg px-3 py-2.5"></select>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titre de l'annonce *</label>
            <input type="text" name="title" required placeholder="Ex: Belle villa 4 chambres à Akanda" value="<?= h($_POST['title'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description * (min. 20 caractères)</label>
            <textarea name="description" rows="5" required class="w-full border border-gray-200 rounded-lg px-3 py-2.5"><?= h($_POST['description'] ?? '') ?></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) *</label>
                <input type="number" name="price" required min="1" value="<?= h($_POST['price'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                <select name="city" required class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
                    <?php foreach ($cities as $c): ?><option value="<?= $c ?>"><?= $c ?></option><?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
                <input type="text" name="neighborhood" value="<?= h($_POST['neighborhood'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse * (privée, communiquée après acceptation de visite)</label>
            <input type="text" name="address" required value="<?= h($_POST['address'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
        </div>

        <!-- Détails spécifiques -->
        <div id="houseDetails" class="hidden border-t border-gray-100 pt-4">
            <h3 class="font-bold text-sm text-gray-800 mb-3">Détails du bien immobilier</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input type="number" name="d_surface" placeholder="Surface (m²)" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <input type="number" name="d_bedrooms" placeholder="Chambres" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <input type="number" name="d_bathrooms" placeholder="Salles de bain" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <select name="d_furnished" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">Meublé ?</option><option value="FURNISHED">Meublé</option><option value="SEMI_FURNISHED">Semi-meublé</option><option value="UNFURNISHED">Non meublé</option></select>
                <select name="d_condition" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">État</option><option value="NEW">Neuf</option><option value="EXCELLENT">Excellent</option><option value="GOOD">Bon</option><option value="FAIR">Correct</option><option value="RENOVATE">À rénover</option></select>
                <input type="number" name="d_parking" placeholder="Places parking" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            </div>
        </div>
        <div id="carDetails" class="hidden border-t border-gray-100 pt-4">
            <h3 class="font-bold text-sm text-gray-800 mb-3">Détails du véhicule</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input type="text" name="d_brand" placeholder="Marque" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <input type="text" name="d_model" placeholder="Modèle" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <input type="number" name="d_year" placeholder="Année" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <input type="number" name="d_mileage" placeholder="Kilométrage" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <select name="d_fuel" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">Carburant</option><option value="PETROL">Essence</option><option value="DIESEL">Diesel</option><option value="ELECTRIC">Électrique</option><option value="HYBRID">Hybride</option></select>
                <select name="d_transmission" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">Transmission</option><option value="MANUAL">Manuelle</option><option value="AUTOMATIC">Automatique</option></select>
            </div>
        </div>
        <div id="landDetails" class="hidden border-t border-gray-100 pt-4">
            <h3 class="font-bold text-sm text-gray-800 mb-3">Détails du terrain</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input type="number" name="d_surface" placeholder="Superficie (m²)" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <select name="d_topography" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">Topographie</option><option value="FLAT">Plat</option><option value="SLOPED">En pente</option><option value="HILLY">Vallonné</option></select>
                <select name="d_boundary_marked" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">Borné ?</option><option value="1">Oui</option><option value="0">Non</option></select>
                <input type="text" name="d_zoning" placeholder="Zone (résidentielle...)" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            </div>
        </div>

        <!-- Médias -->
        <div class="border-t border-gray-100 pt-4">
            <h3 class="font-bold text-sm text-gray-800 mb-3">📸 Médias (max <?= MAX_PHOTOS ?> photos + <?= MAX_VIDEOS ?> vidéo)</h3>
            <label class="block text-sm font-medium text-gray-700 mb-1">Photos (max <?= MAX_PHOTOS ?>)</label>
            <input type="file" name="photos[]" accept="image/*" multiple id="photosInput" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
            <p id="photoWarn" class="text-xs text-red-600 hidden mb-2">⚠️ Maximum <?= MAX_PHOTOS ?> photos ! Seules les <?= MAX_PHOTOS ?> premières seront prises.</p>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vidéo (1 max, optionnelle)</label>
            <input type="file" name="video" accept="video/*" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
        </div>

        <button class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-lg font-bold text-lg" id="submitBtn">Publier l'annonce</button>
        <p class="text-xs text-gray-400 text-center">Votre annonce sera examinée par l'équipe KAPUCE.G avant publication.</p>
    </form>
</div>
<script>
const SUBS = {
    HOUSE: [['HOUSE','Maison'],['APARTMENT','Appartement'],['VILLA','Villa'],['STUDIO','Studio'],['DUPLEX','Duplex'],['OFFICE','Bureau'],['SHOP','Local commercial'],['WAREHOUSE','Entrepôt']],
    CAR: [['CAR','Voiture'],['MOTORCYCLE','Moto'],['TRUCK','Camion'],['VAN','Utilitaire'],['BUS','Bus / Minibus'],['BOAT','Bateau'],['OTHER','Autre']],
    LAND: [['RESIDENTIAL','Résidentiel'],['COMMERCIAL','Commercial'],['AGRICULTURAL','Agricole'],['INDUSTRIAL','Industriel']]
};
function showDetails() {
    const t = document.getElementById('typeSelect').value;
    ['houseDetails','carDetails','landDetails'].forEach(id => document.getElementById(id).classList.add('hidden'));
    if (t === 'HOUSE') document.getElementById('houseDetails').classList.remove('hidden');
    if (t === 'CAR') document.getElementById('carDetails').classList.remove('hidden');
    if (t === 'LAND') document.getElementById('landDetails').classList.remove('hidden');
    const sub = document.getElementById('subCategory');
    sub.innerHTML = '';
    (SUBS[t] || []).forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; sub.appendChild(o); });
}
document.getElementById('photosInput').addEventListener('change', function() {
    document.getElementById('photoWarn').classList.toggle('hidden', this.files.length <= <?= MAX_PHOTOS ?>);
});
document.querySelector('form').addEventListener('submit', function() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Publication en cours (upload des médias)...';
});
</script>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
