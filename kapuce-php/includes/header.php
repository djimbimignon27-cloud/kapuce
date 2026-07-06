<?php
require_once __DIR__ . '/auth.php';
$currentUser = current_user();
$unread = $currentUser ? unread_messages_count($currentUser['id']) : 0;
$flashMsg = flash();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? h($pageTitle) . ' - ' : '' ?><?= SITE_NAME ?> | Immobilier, Véhicules & Terrains au Gabon</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#16a34a', 600: '#15803d', 700: '#166534', 900: '#14532d' }
                    }
                }
            }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style> body { font-family: 'Inter', sans-serif; } </style>
</head>
<body class="bg-gray-50 min-h-screen flex flex-col">
<nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center h-16">
            <a href="/index.php" class="flex items-center gap-2">
                <div class="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg">K</div>
                <span class="font-extrabold text-xl text-gray-900">KAPUCE<span class="text-brand-600">.G</span></span>
            </a>
            <div class="hidden md:flex items-center gap-6">
                <a href="/listings.php" class="text-gray-600 hover:text-brand-600 font-medium">Annonces</a>
                <a href="/listings.php?type=HOUSE" class="text-gray-600 hover:text-brand-600 font-medium">Immobilier</a>
                <a href="/listings.php?type=CAR" class="text-gray-600 hover:text-brand-600 font-medium">Véhicules</a>
                <a href="/listings.php?type=LAND" class="text-gray-600 hover:text-brand-600 font-medium">Terrains</a>
            </div>
            <div class="flex items-center gap-3">
                <?php if ($currentUser): ?>
                    <a href="/messages.php" class="relative text-gray-600 hover:text-brand-600 p-2" title="Messagerie">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        <?php if ($unread > 0): ?><span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"><?= $unread > 9 ? '9+' : $unread ?></span><?php endif; ?>
                    </a>
                    <a href="/dashboard/index.php" class="hidden sm:inline-flex text-gray-700 hover:text-brand-600 font-medium">Mon espace</a>
                    <?php if (is_admin($currentUser)): ?><a href="/admin/index.php" class="hidden sm:inline-flex text-purple-600 hover:text-purple-800 font-medium">Admin</a><?php endif; ?>
                    <a href="/logout.php" class="text-sm text-gray-500 hover:text-red-600">Déconnexion</a>
                <?php else: ?>
                    <a href="/login.php" class="text-gray-700 hover:text-brand-600 font-medium">Connexion</a>
                    <a href="/register.php" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">S'inscrire</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>
<?php if ($flashMsg): ?>
<div class="max-w-7xl mx-auto px-4 mt-4">
    <div class="rounded-lg px-4 py-3 text-sm font-medium <?= $flashMsg['type'] === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200' ?>">
        <?= h($flashMsg['msg']) ?>
    </div>
</div>
<?php endif; ?>
<main class="flex-1">
