<?php
// Header commun du panel admin - $admin disponible après inclusion
require_once __DIR__ . '/../includes/auth.php';
$admin = require_admin();
$adminPage = basename($_SERVER['SCRIPT_NAME']);
function nav_cls($page, $current) { return $page === $current ? 'bg-purple-700 text-white' : 'text-purple-100 hover:bg-purple-700/50'; }
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? h($pageTitle) . ' - ' : '' ?>Admin KAPUCE.G</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
<nav class="bg-purple-900 text-white">
    <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-14">
            <div class="flex items-center gap-4 overflow-x-auto">
                <a href="/admin/index.php" class="font-extrabold whitespace-nowrap">⚙️ KAPUCE.G Admin</a>
                <a href="/admin/index.php" class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap <?= nav_cls('index.php', $adminPage) ?>">Dashboard</a>
                <a href="/admin/listings.php" class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap <?= nav_cls('listings.php', $adminPage) ?>">Annonces</a>
                <a href="/admin/users.php" class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap <?= nav_cls('users.php', $adminPage) ?>">Utilisateurs</a>
                <a href="/admin/messages.php" class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap <?= nav_cls('messages.php', $adminPage) ?>">Messages & Fraudes</a>
                <a href="/admin/transactions.php" class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap <?= nav_cls('transactions.php', $adminPage) ?>">Transactions</a>
                <a href="/admin/settings.php" class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap <?= nav_cls('settings.php', $adminPage) ?>">Taux</a>
            </div>
            <div class="flex items-center gap-3 whitespace-nowrap">
                <a href="/index.php" class="text-purple-200 hover:text-white text-sm">Voir le site</a>
                <a href="/logout.php" class="text-purple-200 hover:text-white text-sm">Déconnexion</a>
            </div>
        </div>
    </div>
</nav>
<?php $f = flash(); if ($f): ?>
<div class="max-w-7xl mx-auto px-4 mt-4">
    <div class="rounded-lg px-4 py-3 text-sm font-medium <?= $f['type'] === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200' ?>"><?= h($f['msg']) ?></div>
</div>
<?php endif; ?>
