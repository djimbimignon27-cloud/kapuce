<?php
$pageTitle = 'Accueil';
$heroNav = true;
require_once __DIR__ . '/includes/header.php';

$featured = db()->query("SELECT l.*, u.full_name AS owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.status = 'ACTIVE' ORDER BY l.featured DESC, l.created_at DESC LIMIT 8")->fetchAll();

$DEMO_IMAGES = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
    'https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
];
function home_card_image($l, $i, $demos) {
    $images = json_decode($l['images'] ?? '[]', true) ?: [];
    return !empty($images[0]['url']) ? $images[0]['url'] : $demos[$i % count($demos)];
}
?>
<!-- Hero plein écran avec image de fond -->
<div class="relative min-h-screen flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1694771170091-849084a0d677?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600" alt="Hero" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-br from-kama-blue/90 via-kama-blue/80 to-blue-900/90"></div>
    </div>
    <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style="animation-delay:1s"></div>
        <div class="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse" style="animation-delay:2s"></div>
    </div>

    <div class="relative container mx-auto px-4 pt-32 pb-20 max-w-7xl">
        <div class="max-w-5xl mx-auto text-center">
            <div class="mb-8">
                <span class="inline-flex items-center bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-2 text-sm rounded-full">
                    <span class="text-kama-gold mr-2">★</span> Plateforme N°1 de confiance au Gabon
                </span>
            </div>
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-black mb-8 text-white leading-tight">
                Trouvez votre
                <span class="block text-gradient-gold">bien idéal</span>
            </h1>
            <p class="text-xl md:text-2xl mb-12 text-blue-100/90 max-w-3xl mx-auto">
                Immobilier • Véhicules • Terrains — Des transactions sécurisées avec vérification complète
            </p>

            <!-- Barre de recherche premium -->
            <div class="max-w-4xl mx-auto">
                <form action="/listings.php" method="get" class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-4 md:p-6 border border-white/50">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="relative">
                            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            <input type="text" name="q" placeholder="Que recherchez-vous?" class="w-full pl-12 h-14 text-gray-900 border border-gray-200 rounded-xl focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20 text-base px-3">
                        </div>
                        <select name="type" class="h-14 text-gray-900 border border-gray-200 rounded-xl px-3">
                            <option value="">Tous types</option>
                            <option value="HOUSE">🏠 Immobilier</option>
                            <option value="CAR">🚗 Véhicules</option>
                            <option value="LAND">📍 Terrains</option>
                        </select>
                        <select name="category" class="h-14 text-gray-900 border border-gray-200 rounded-xl px-3">
                            <option value="">Vente & Location</option>
                            <option value="SALE">🏷️ Vente</option>
                            <option value="RENT">🏠 Location</option>
                        </select>
                        <button class="h-14 bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/40 text-white font-bold text-base rounded-xl transition-all duration-300 hover:scale-[1.02]">
                            🔍 Rechercher
                        </button>
                    </div>
                </form>
            </div>

            <!-- Statistiques de confiance -->
            <div class="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div class="text-center">
                    <div class="text-4xl font-black text-white mb-2">500+</div>
                    <div class="text-blue-200 text-sm">Annonces Vérifiées</div>
                </div>
                <div class="text-center border-x border-white/20">
                    <div class="text-4xl font-black text-kama-gold mb-2">98%</div>
                    <div class="text-blue-200 text-sm">Clients Satisfaits</div>
                </div>
                <div class="text-center">
                    <div class="text-4xl font-black text-white mb-2">24/7</div>
                    <div class="text-blue-200 text-sm">Support Client</div>
                </div>
            </div>
        </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div class="w-8 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div class="w-1.5 h-3 bg-white/60 rounded-full animate-pulse"></div>
        </div>
    </div>
</div>

<!-- Section Pourquoi KAPUCE.G -->
<div class="py-24 bg-white relative overflow-hidden">
    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-kama-gold to-transparent"></div>
    <div class="container mx-auto px-4 max-w-7xl">
        <div class="text-center mb-16">
            <span class="inline-flex items-center bg-kama-gold/10 text-kama-gold border border-kama-gold/30 mb-4 px-4 py-1.5 rounded-full text-sm">✨ Pourquoi KAPUCE.G</span>
            <h2 class="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                La confiance au cœur de
                <span class="text-gradient-gold"> chaque transaction</span>
            </h2>
            <p class="text-gray-600 text-lg max-w-2xl mx-auto">Une plateforme pensée pour votre sécurité et votre réussite</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-kama-gold/30 overflow-hidden">
                <div class="w-16 h-16 bg-gradient-to-br from-kama-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h3 class="text-2xl font-bold mb-4 text-gray-900">Sécurité Maximale</h3>
                <p class="text-gray-600 leading-relaxed">Vérification complète de chaque annonce et utilisateur pour des transactions en toute confiance</p>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kama-gold to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </div>
            <div class="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-kama-gold/30 overflow-hidden">
                <div class="w-16 h-16 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 class="text-2xl font-bold mb-4 text-gray-900">Confiance Garantie</h3>
                <p class="text-gray-600 leading-relaxed">Système d'avis et badges vérifiés pour identifier les vendeurs de confiance</p>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kama-gold to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </div>
            <div class="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-kama-gold/30 overflow-hidden">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </div>
                <h3 class="text-2xl font-bold mb-4 text-gray-900">Simplicité & Rapidité</h3>
                <p class="text-gray-600 leading-relaxed">Interface intuitive et recherche avancée pour trouver votre bien en quelques clics</p>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kama-gold to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </div>
        </div>
    </div>
</div>

<!-- Section Annonces -->
<div class="py-24 bg-gradient-to-b from-slate-50 to-white">
    <div class="container mx-auto px-4 max-w-7xl">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
                <span class="inline-flex items-center bg-kama-gold/10 text-kama-gold border border-kama-gold/30 mb-3 px-4 py-1 rounded-full text-sm">📈 Nouvelles annonces</span>
                <h2 class="text-4xl font-black text-gray-900">Découvrez nos biens</h2>
            </div>
            <a href="/listings.php" class="inline-flex items-center bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg hover:shadow-kama-blue/30 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                Voir toutes les annonces →
            </a>
        </div>

        <?php if (!$featured): ?>
        <div class="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
            <div class="w-24 h-24 bg-gradient-to-br from-kama-gold/10 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🏠</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Aucune annonce pour le moment</h3>
            <p class="text-gray-600 mb-8">Soyez le premier à publier une annonce!</p>
            <a href="/dashboard/create-listing.php" class="inline-flex bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg text-white px-8 py-3 rounded-lg font-bold">+ Publier une annonce</a>
        </div>
        <?php else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <?php foreach ($featured as $i => $l): ?>
            <a href="/listing.php?id=<?= h($l['id']) ?>" class="group bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg rounded-2xl overflow-hidden block">
                <div class="aspect-[4/3] relative overflow-hidden">
                    <img src="<?= h(home_card_image($l, $i, $DEMO_IMAGES)) ?>" alt="<?= h($l['title']) ?>" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <?php if ($l['verified']): ?>
                    <span class="absolute top-3 left-3 inline-flex items-center bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">✓ Vérifié</span>
                    <?php endif; ?>
                    <span class="absolute top-3 right-3 bg-kama-gold/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full"><?= $l['category'] === 'SALE' ? 'Vente' : 'Location' ?></span>
                    <div class="absolute bottom-3 left-3 right-3">
                        <p class="text-2xl font-bold text-white drop-shadow-lg"><?= format_price($l['price']) ?></p>
                    </div>
                    <div class="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 text-white text-xs">
                        👁 <?= (int)$l['views_count'] ?>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="p-1.5 bg-kama-blue/10 rounded-lg text-sm"><?= $l['type'] === 'HOUSE' ? '🏠' : ($l['type'] === 'CAR' ? '🚗' : '📍') ?></span>
                        <span class="text-xs text-kama-blue font-semibold uppercase"><?= type_label($l['type']) ?></span>
                    </div>
                    <h3 class="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-kama-blue transition-colors min-h-[3.5rem]"><?= h($l['title']) ?></h3>
                    <div class="flex items-center text-gray-500 text-sm">
                        <span class="text-kama-gold mr-1.5">📍</span>
                        <span class="truncate"><?= h($l['city']) ?></span>
                    </div>
                </div>
                <div class="h-1 bg-gradient-to-r from-kama-blue via-kama-gold to-kama-blue transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</div>

<!-- Section CTA -->
<div class="py-24 bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue relative overflow-hidden">
    <div class="absolute inset-0">
        <div class="absolute top-0 right-0 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style="animation-delay:1s"></div>
    </div>
    <div class="relative container mx-auto px-4 text-center max-w-7xl">
        <?php if ($currentUser): ?>
        <h2 class="text-4xl md:text-5xl font-black text-white mb-6">Publiez votre annonce</h2>
        <p class="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Vendez ou louez vos biens en toute simplicité sur KAPUCE.G</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/dashboard/create-listing.php" class="inline-flex items-center justify-center bg-gradient-to-r from-kama-gold to-yellow-500 text-white hover:shadow-xl font-bold px-8 py-4 text-lg rounded-xl shadow-lg transition-all">+ Publier une annonce</a>
            <a href="/dashboard/index.php" class="inline-flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-kama-blue font-bold px-8 py-4 text-lg rounded-xl transition-all">Mon tableau de bord</a>
        </div>
        <?php else: ?>
        <h2 class="text-4xl md:text-5xl font-black text-white mb-6">Prêt à commencer?</h2>
        <p class="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Rejoignez des milliers d'utilisateurs qui font confiance à KAPUCE.G pour leurs transactions</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register.php" class="inline-flex items-center justify-center bg-white text-kama-blue hover:bg-gray-100 font-bold px-8 py-4 text-lg rounded-xl shadow-lg transition-all">Créer un compte gratuit</a>
            <a href="/listings.php" class="inline-flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-kama-blue font-bold px-8 py-4 text-lg rounded-xl transition-all">🔍 Explorer les annonces</a>
        </div>
        <?php endif; ?>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
