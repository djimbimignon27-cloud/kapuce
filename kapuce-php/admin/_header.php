<?php
// Layout Admin KAPUCE.G - Sidebar sombre identique à l'original
ob_start(); // Permet les redirections dans les pages qui traitent les POST après inclusion
require_once __DIR__ . '/../includes/auth.php';
$admin = require_admin();
$adminPage = basename($_SERVER['SCRIPT_NAME']);

// Compteurs pour les badges du menu
$pdo = db();
$badgeUsers = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$badgeListingsPending = (int)$pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'PENDING'")->fetchColumn();
$badgeAlertsPending = (int)$pdo->query("SELECT COUNT(*) FROM fraud_alerts WHERE status IN ('PENDING','NEW')")->fetchColumn();
$badgeTx = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE status = 'PAID'")->fetchColumn();

$menuItems = [
    ['file' => 'index.php', 'label' => 'Dashboard', 'icon' => 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 'badge' => null, 'color' => ''],
    ['file' => 'users.php', 'label' => 'Utilisateurs', 'icon' => 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', 'badge' => $badgeUsers, 'color' => 'gray'],
    ['file' => 'listings.php', 'label' => 'Annonces', 'icon' => 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'badge' => $badgeListingsPending, 'color' => 'yellow'],
    ['file' => 'alerts.php', 'label' => 'Alertes Fraude', 'icon' => 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', 'badge' => $badgeAlertsPending, 'color' => 'red'],
    ['file' => 'messages.php', 'label' => 'Messages', 'icon' => 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', 'badge' => null, 'color' => ''],
    ['file' => 'transactions.php', 'label' => 'Transactions', 'icon' => 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'badge' => $badgeTx, 'color' => 'yellow'],
    ['file' => 'reviews.php', 'label' => 'Avis', 'icon' => 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', 'badge' => null, 'color' => ''],
    ['file' => 'settings.php', 'label' => 'Paramètres', 'icon' => 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'badge' => null, 'color' => ''],
];
$pageTitle = $pageTitle ?? 'Dashboard';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($pageTitle) ?> - Admin KAPUCE.G</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: { extend: { colors: { 'kama-blue': '#0B3D91', 'kama-gold': '#C9A227' } } }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style> body { font-family: 'Inter', sans-serif; } </style>
</head>
<body class="bg-gray-50 min-h-screen">

<!-- Sidebar sombre -->
<aside class="fixed top-0 left-0 z-40 h-screen w-72 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-800">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
                <h2 class="text-white font-bold text-lg">KAPUCE.G Admin</h2>
                <p class="text-gray-500 text-xs">Panneau d'administration</p>
            </div>
        </div>
    </div>

    <!-- Carte Admin -->
    <div class="p-4 mx-4 mt-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-sm"><?= h(mb_strtoupper(mb_substr($admin['full_name'], 0, 1))) ?></span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-white font-medium text-sm truncate"><?= h($admin['full_name']) ?></p>
                <span class="inline-block bg-red-500/20 text-red-400 border border-red-500/30 text-xs mt-1 px-2 py-0.5 rounded-full font-semibold"><?= h($admin['role']) ?></span>
            </div>
        </div>
    </div>

    <!-- Menu -->
    <nav class="flex-1 p-4 space-y-2">
        <?php foreach ($menuItems as $item): $active = $adminPage === $item['file']; ?>
        <a href="/admin/<?= $item['file'] ?>" class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 <?= $active ? 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-white border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800/50' ?>">
            <div class="flex items-center gap-3">
                <svg class="w-5 h-5 flex-shrink-0 <?= $active ? 'text-red-400' : '' ?>" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="<?= $item['icon'] ?>"/></svg>
                <span class="font-medium"><?= $item['label'] ?></span>
            </div>
            <?php if ($item['badge'] !== null && $item['badge'] > 0): ?>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $item['color'] === 'red' ? 'bg-red-500/20 text-red-400' : ($item['color'] === 'yellow' ? 'bg-kama-gold/20 text-kama-gold' : 'bg-gray-700 text-gray-300') ?>"><?= $item['badge'] ?></span>
            <?php endif; ?>
        </a>
        <?php endforeach; ?>
    </nav>

    <!-- Bas de sidebar -->
    <div class="p-4 border-t border-gray-800 space-y-2">
        <a href="/index.php" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            <span class="font-medium">Voir le site</span>
        </a>
        <a href="/logout.php" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span class="font-medium">Déconnexion</span>
        </a>
    </div>
</aside>

<!-- Contenu principal -->
<div class="ml-72">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="flex items-center justify-between px-6 py-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900"><?= h($pageTitle) ?></h1>
                <p class="text-sm text-gray-500">Gérez votre plateforme KAPUCE.G</p>
            </div>
            <div class="flex items-center gap-4">
                <a href="/admin/alerts.php" class="relative p-2.5 hover:bg-gray-100 rounded-xl transition" title="Alertes">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <?php if ($badgeAlertsPending > 0): ?><span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span><?php endif; ?>
                </a>
            </div>
        </div>
    </header>

    <?php $f = flash(); if ($f): ?>
    <div class="px-6 pt-4">
        <div class="rounded-xl px-4 py-3 text-sm font-medium <?= $f['type'] === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200' ?>"><?= h($f['msg']) ?></div>
    </div>
    <?php endif; ?>

    <main class="p-6">
