</main>
<!-- Footer identique à la version originale -->
<footer class="bg-gray-900 text-white py-16 mt-16">
    <div class="container mx-auto px-4 max-w-7xl">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
                <div class="flex items-center gap-3 mb-6">
                    <div class="flex items-center justify-center h-12 w-12 bg-gradient-to-br from-kama-blue to-blue-700 rounded-xl">
                        <span class="text-white font-black text-lg">K.G</span>
                    </div>
                    <div>
                        <span class="font-bold text-xl">KAPUCE.G</span>
                        <p class="text-gray-500 text-xs">Transactions Sécurisées</p>
                    </div>
                </div>
                <p class="text-gray-400 leading-relaxed">La plateforme de confiance pour toutes vos transactions immobilières au Gabon.</p>
            </div>
            <div>
                <h4 class="font-bold text-lg mb-4 text-kama-gold">Navigation</h4>
                <ul class="space-y-3 text-gray-400">
                    <li><a href="/index.php" class="hover:text-kama-gold transition">Accueil</a></li>
                    <li><a href="/listings.php" class="hover:text-kama-gold transition">Annonces</a></li>
                    <li><a href="/dashboard/index.php" class="hover:text-kama-gold transition">Mon compte</a></li>
                    <li><a href="/messages.php" class="hover:text-kama-gold transition">Messagerie</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-lg mb-4 text-kama-gold">Catégories</h4>
                <ul class="space-y-3 text-gray-400">
                    <li><a href="/listings.php?type=HOUSE" class="hover:text-kama-gold transition">🏠 Immobilier</a></li>
                    <li><a href="/listings.php?type=CAR" class="hover:text-kama-gold transition">🚗 Véhicules</a></li>
                    <li><a href="/listings.php?type=LAND" class="hover:text-kama-gold transition">📍 Terrains</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-lg mb-4 text-kama-gold">Contact</h4>
                <ul class="space-y-3 text-gray-400 text-sm">
                    <li class="flex items-center gap-2">
                        <span class="text-kama-gold">✉️</span> contact@kapuce-gabon.com
                    </li>
                    <li class="flex items-center gap-2">
                        <span class="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">AIRTEL</span>
                        <a href="tel:+241<?= CONTACT_AIRTEL ?>" class="font-semibold text-white hover:text-kama-gold"><?= CONTACT_AIRTEL ?></a>
                    </li>
                    <li class="flex items-center gap-2">
                        <span class="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">MOOV</span>
                        <a href="tel:+241<?= CONTACT_MOOV ?>" class="font-semibold text-white hover:text-kama-gold"><?= CONTACT_MOOV ?></a>
                    </li>
                    <li class="flex items-center gap-2">
                        <span class="text-kama-gold">📍</span> Libreville, Gabon
                    </li>
                </ul>
            </div>
        </div>
        <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-500 text-sm">© <?= date('Y') ?> KAPUCE.G. Tous droits réservés.</p>
            <div class="flex items-center gap-2 text-gray-500 text-sm">
                <span>Fait avec</span><span class="text-red-500">❤️</span><span>au Gabon</span><span class="ml-2">🇬🇦</span>
            </div>
        </div>
    </div>
</footer>
</body>
</html>
