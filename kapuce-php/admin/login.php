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
</head>
<body class="bg-gray-900 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
            <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-3">K</div>
            <h1 class="text-xl font-extrabold text-gray-900">Administration KAPUCE.G</h1>
            <p class="text-sm text-gray-500">Accès réservé</p>
        </div>
        <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="email" name="email" required placeholder="Email administrateur" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            <input type="password" name="password" required placeholder="Mot de passe" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">Connexion Admin</button>
        </form>
    </div>
</body>
</html>
