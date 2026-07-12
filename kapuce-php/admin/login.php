<?php
require_once __DIR__ . '/../includes/auth.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $email = mb_strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($password, $u['password_hash']) || !is_admin($u)) {
        $error = 'Identifiants administrateur incorrects.';
    } else {
        $_SESSION['user_id'] = $u['id'];
        redirect('/admin/index.php');
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - KAPUCE.G</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { theme: { extend: { colors: { 'kama-blue': '#0B3D91', 'kama-gold': '#C9A227' } } } }</script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style> body { font-family: 'Inter', sans-serif; } </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-kama-gold/10 rounded-full filter blur-3xl"></div>
    <div class="relative bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg shadow-red-500/20 mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h1 class="text-2xl font-black text-white">Administration KAPUCE.G</h1>
            <p class="text-gray-400 text-sm mt-1">Accès réservé au personnel autorisé</p>
        </div>
        <?php if ($error): ?><div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Email administrateur</label>
                <input type="email" name="email" required class="w-full h-12 bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder-gray-500" placeholder="admin@kapuce.com">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
                <input type="password" name="password" required class="w-full h-12 bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" placeholder="••••••••">
            </div>
            <button class="w-full h-14 bg-gradient-to-r from-red-500 to-red-700 hover:shadow-lg hover:shadow-red-500/30 text-white rounded-xl font-bold text-lg transition-all">Connexion Admin</button>
        </form>
        <p class="text-xs text-gray-500 text-center mt-6">🛡️ Connexion sécurisée — Toutes les actions sont enregistrées</p>
    </div>
</body>
</html>
