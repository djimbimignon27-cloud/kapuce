<?php
require_once __DIR__ . '/includes/auth.php';

if (is_logged_in()) redirect('/dashboard/index.php');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $fullName = trim($_POST['full_name'] ?? '');
    $email = mb_strtolower(trim($_POST['email'] ?? ''));
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = in_array($_POST['role'] ?? '', ['USER', 'OWNER', 'AGENCY']) ? $_POST['role'] : 'USER';

    if (mb_strlen($fullName) < 3) $error = 'Veuillez saisir votre nom complet.';
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'Email invalide.';
    elseif (mb_strlen($phone) < 8) $error = 'Numéro de téléphone invalide.';
    elseif (mb_strlen($password) < 8) $error = 'Le mot de passe doit contenir au moins 8 caractères.';
    else {
        $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetchColumn()) {
            $error = 'Un compte existe déjà avec cet email.';
        } else {
            $id = uuid();
            db()->prepare('INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$id, $fullName, $email, $phone, password_hash($password, PASSWORD_BCRYPT), $role]);
            $_SESSION['user_id'] = $id;
            flash('Bienvenue sur KAPUCE.G, ' . $fullName . ' ! Votre compte a été créé.');
            redirect('/dashboard/index.php');
        }
    }
}
$pageTitle = 'Inscription';
require_once __DIR__ . '/includes/header.php';
?>
<div class="min-h-[70vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <div class="absolute top-0 left-0 w-96 h-96 bg-kama-gold/10 rounded-full filter blur-3xl"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-kama-blue/10 rounded-full filter blur-3xl"></div>
    <div class="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 max-w-md w-full">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-kama-blue to-blue-700 rounded-2xl shadow-lg mb-4">
                <span class="text-white font-black text-xl">K.G</span>
            </div>
            <h1 class="text-3xl font-black text-gray-900">Créer un compte</h1>
            <p class="text-gray-500 mt-1">Rejoignez la plateforme N°1 au Gabon</p>
        </div>
        <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Je suis</label>
                <select name="role" class="w-full h-12 border border-gray-200 rounded-xl px-4">
                    <option value="USER">Client (je cherche un bien)</option>
                    <option value="OWNER">Propriétaire (je publie des annonces)</option>
                    <option value="AGENCY">Agence immobilière</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input type="text" name="full_name" required value="<?= h($_POST['full_name'] ?? '') ?>" class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required value="<?= h($_POST['email'] ?? '') ?>" class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone (privé, jamais affiché)</label>
                <input type="tel" name="phone" required placeholder="+241 XX XX XX XX" value="<?= h($_POST['phone'] ?? '') ?>" class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe (8 caractères min.)</label>
                <input type="password" name="password" required minlength="8" class="w-full h-12 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
            </div>
            <button class="w-full h-14 bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/40 text-white rounded-xl font-bold text-lg transition-all duration-300">Créer mon compte</button>
        </form>
        <p class="text-sm text-gray-500 text-center mt-6">Déjà inscrit ? <a href="/login.php" class="text-kama-blue font-bold hover:underline">Se connecter</a></p>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
