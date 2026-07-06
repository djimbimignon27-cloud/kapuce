<?php
require_once __DIR__ . '/includes/auth.php';

if (is_logged_in()) redirect('/dashboard/index.php');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $email = mb_strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($password, $u['password_hash'])) {
        $error = 'Email ou mot de passe incorrect.';
    } elseif ($u['is_banned']) {
        $error = 'Votre compte a été suspendu. Contactez le support KAPUCE.G.';
    } else {
        $_SESSION['user_id'] = $u['id'];
        redirect(is_admin($u) ? '/admin/index.php' : '/dashboard/index.php');
    }
}
$pageTitle = 'Connexion';
require_once __DIR__ . '/includes/header.php';
?>
<div class="max-w-md mx-auto px-4 py-16">
    <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h1 class="text-2xl font-extrabold text-gray-900 mb-1">Connexion</h1>
        <p class="text-sm text-gray-500 mb-6">Heureux de vous revoir sur KAPUCE.G</p>
        <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required value="<?= h($_POST['email'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input type="password" name="password" required class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <button class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-bold">Se connecter</button>
        </form>
        <p class="text-sm text-gray-500 text-center mt-5">Pas encore de compte ? <a href="/register.php" class="text-brand-600 font-semibold">S'inscrire</a></p>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
