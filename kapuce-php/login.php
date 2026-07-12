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
<div class="min-h-[70vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-kama-gold/10 rounded-full filter blur-3xl"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-kama-blue/10 rounded-full filter blur-3xl"></div>
    <div class="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 max-w-md w-full">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-kama-blue to-blue-700 rounded-2xl shadow-lg mb-4">
                <span class="text-white font-black text-xl">K.G</span>
            </div>
            <h1 class="text-3xl font-black text-gray-900">Bon retour !</h1>
            <p class="text-gray-500 mt-1">Connectez-vous à votre compte KAPUCE.G</p>
        </div>
        <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required value="<?= h($_POST['email'] ?? '') ?>" class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input type="password" name="password" required class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <button class="w-full h-14 bg-gradient-to-r from-kama-blue via-blue-600 to-kama-blue hover:shadow-lg hover:shadow-kama-blue/30 text-white rounded-xl font-bold text-lg transition-all duration-300">Se connecter</button>
        </form>
        <p class="text-sm text-gray-500 text-center mt-6">Pas encore de compte ? <a href="/register.php" class="text-kama-gold font-bold hover:underline">S'inscrire gratuitement</a></p>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
