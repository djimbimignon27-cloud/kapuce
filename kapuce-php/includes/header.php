<?php
require_once __DIR__ . '/auth.php';
$currentUser = current_user();
$unread = $currentUser ? unread_messages_count($currentUser['id']) : 0;
$notifCount = $currentUser ? unread_notifications_count($currentUser['id']) : 0;
$flashMsg = flash();
$heroNav = $heroNav ?? false;
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
                        'kama-blue': '#0B3D91',
                        'kama-gold': '#C9A227',
                        brand: { 50: '#eff4ff', 100: '#dbe7ff', 500: '#0B3D91', 600: '#0B3D91', 700: '#082e6e', 900: '#051d47' }
                    }
                }
            }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .text-gradient-gold { background: linear-gradient(90deg, #C9A227, #eab308, #C9A227); -webkit-background-clip: text; background-clip: text; color: transparent; }
        <?php if ($heroNav): ?>
        #mainNav { background: transparent; }
        #mainNav.scrolled { background: rgba(255,255,255,.92); backdrop-filter: blur(16px); box-shadow: 0 10px 30px rgba(0,0,0,.08); border-bottom: 1px solid #f3f4f6; }
        #mainNav .nav-label { color: rgba(255,255,255,.92); }
        #mainNav.scrolled .nav-label { color: #374151; }
        #mainNav .nav-brand { color: #ffffff; }
        #mainNav.scrolled .nav-brand { color: #0B3D91; }
        #mainNav .nav-sub { color: rgba(255,255,255,.7); }
        #mainNav.scrolled .nav-sub { color: #6b7280; }
        <?php else: ?>
        #mainNav { background: rgba(255,255,255,.95); backdrop-filter: blur(16px); border-bottom: 1px solid #f3f4f6; }
        #mainNav .nav-label { color: #374151; }
        #mainNav .nav-brand { color: #0B3D91; }
        #mainNav .nav-sub { color: #6b7280; }
        <?php endif; ?>
    </style>
</head>
<body class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
<nav id="mainNav" class="<?= $heroNav ? 'fixed' : 'sticky' ?> w-full top-0 z-50 transition-all duration-500">
    <div class="container mx-auto px-4 max-w-7xl">
        <div class="flex items-center justify-between h-20">
            <a href="/index.php" class="flex items-center space-x-3 group">
                <div class="relative">
                    <div class="absolute inset-0 bg-kama-gold/30 blur-2xl rounded-full group-hover:bg-kama-gold/50 transition-all duration-500"></div>
                    <div class="relative z-10 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-kama-blue to-blue-700 rounded-xl shadow-lg">
                        <span class="text-white font-black text-lg sm:text-xl">K.G</span>
                    </div>
                </div>
                <div class="hidden sm:block">
                    <span class="nav-brand font-bold text-xl transition-colors">KAPUCE.G</span>
                    <p class="nav-sub text-xs transition-colors">Transactions Sécurisées</p>
                </div>
            </a>

            <div class="flex items-center gap-2 sm:gap-4">
                <a href="/listings.php" class="nav-label hidden md:inline-flex font-medium px-4 py-2 rounded-full hover:text-kama-gold transition-all">Annonces</a>
                <?php if ($currentUser): ?>
                    <a href="/dashboard/create-listing.php" class="hidden sm:inline-flex items-center bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/30 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all duration-300 hover:scale-105">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-width="2" stroke-linecap="round" d="M12 8v8m-4-4h8"/></svg>
                        Publier
                    </a>
                    <!-- Cloche notifications -->
                    <div class="relative">
                        <button onclick="toggleNotifs()" class="nav-label relative p-2 hover:text-kama-gold transition" title="Notifications">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                            <?php if ($notifCount > 0): ?><span id="notifBadge" class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"><?= $notifCount > 9 ? '9+' : $notifCount ?></span><?php endif; ?>
                        </button>
                        <div id="notifDropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                            <div class="px-4 py-3 bg-gradient-to-r from-kama-blue to-blue-700 text-white font-bold text-sm">Notifications</div>
                            <div id="notifList" class="max-h-96 overflow-y-auto"><div class="p-6 text-center text-gray-400 text-sm">Chargement...</div></div>
                        </div>
                    </div>
                    <a href="/favorites.php" class="nav-label p-2 hover:text-red-500 transition" title="Mes favoris">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    </a>
                    <a href="/messages.php" class="nav-label relative p-2 hover:text-kama-gold transition" title="Messagerie">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        <?php if ($unread > 0): ?><span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"><?= $unread > 9 ? '9+' : $unread ?></span><?php endif; ?>
                    </a>
                    <a href="/dashboard/index.php" class="nav-label p-2 hover:text-kama-gold transition" title="Mon compte">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </a>
                    <?php if (is_admin($currentUser)): ?>
                        <a href="/admin/index.php" class="inline-flex items-center bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                            Admin
                        </a>
                    <?php endif; ?>
                    <a href="/logout.php" class="nav-label p-2 hover:text-red-500 transition" title="Déconnexion">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    </a>
                <?php else: ?>
                    <a href="/login.php" class="nav-label font-medium px-4 py-2 rounded-full hover:text-kama-gold transition">Connexion</a>
                    <a href="/register.php" class="inline-flex items-center bg-gradient-to-r from-kama-blue via-blue-600 to-kama-blue hover:shadow-lg hover:shadow-kama-blue/30 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 hover:scale-105">
                        ✨ Inscription
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>
<?php if ($heroNav): ?>
<script>
window.addEventListener('scroll', function() {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 50);
});
</script>
<?php endif; ?>
<?php if ($currentUser): ?>
<script>
let notifsOpen = false;
async function toggleNotifs() {
    const dd = document.getElementById('notifDropdown');
    notifsOpen = !notifsOpen;
    dd.classList.toggle('hidden', !notifsOpen);
    if (notifsOpen) {
        try {
            const r = await fetch('/api/notifications.php');
            const data = await r.json();
            const list = document.getElementById('notifList');
            if (!data.notifications || data.notifications.length === 0) {
                list.innerHTML = '<div class="p-6 text-center text-gray-400 text-sm">Aucune notification</div>';
            } else {
                list.innerHTML = data.notifications.map(n => `
                    <a href="${n.link || '#'}" class="block px-4 py-3 border-b border-gray-50 hover:bg-slate-50 ${n.read_at ? 'opacity-60' : ''}">
                        <div class="font-semibold text-sm text-gray-900">${n.title}</div>
                        <div class="text-xs text-gray-500">${n.message}</div>
                        <div class="text-[10px] text-gray-400 mt-1">${n.time}</div>
                    </a>`).join('');
            }
            await fetch('/api/notifications.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'mark_read'}) });
            const badge = document.getElementById('notifBadge');
            if (badge) badge.remove();
        } catch (e) { console.error(e); }
    }
}
document.addEventListener('click', function(e) {
    if (notifsOpen && !e.target.closest('#notifDropdown') && !e.target.closest('button[onclick="toggleNotifs()"]')) {
        notifsOpen = false;
        document.getElementById('notifDropdown').classList.add('hidden');
    }
});
</script>
<?php endif; ?>
<?php if ($flashMsg): ?>
<div class="container mx-auto max-w-7xl px-4 <?= $heroNav ? 'pt-24' : 'mt-4' ?>">
    <div class="rounded-xl px-4 py-3 text-sm font-medium <?= $flashMsg['type'] === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200' ?>">
        <?= h($flashMsg['msg']) ?>
    </div>
</div>
<?php endif; ?>
<main class="flex-1">
