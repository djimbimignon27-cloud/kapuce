<?php
require_once __DIR__ . '/includes/auth.php';
$user = require_login();

$txId = $_GET['tx'] ?? '';
$stmt = db()->prepare('SELECT t.*, l.title AS listing_title, ub.full_name AS buyer_name, us.full_name AS seller_name FROM transactions t JOIN listings l ON l.id = t.listing_id JOIN users ub ON ub.id = t.buyer_id JOIN users us ON us.id = t.seller_id WHERE t.id = ? AND (t.buyer_id = ? OR t.seller_id = ?)');
$stmt->execute([$txId, $user['id'], $user['id']]);
$tx = $stmt->fetch();

if (!$tx) { flash('Transaction introuvable.', 'error'); redirect('/dashboard/transactions.php'); }
if ($tx['status'] !== 'COMPLETED') { flash('Vous ne pouvez noter qu\'une transaction terminée et validée par KAPUCE.G.', 'error'); redirect('/dashboard/transactions.php'); }

$isBuyer = $tx['buyer_id'] === $user['id'];
$reviewedId = $isBuyer ? $tx['seller_id'] : $tx['buyer_id'];
$reviewedName = $isBuyer ? $tx['seller_name'] : $tx['buyer_name'];

// Déjà noté ?
$stmt = db()->prepare('SELECT * FROM reviews WHERE transaction_id = ? AND reviewer_id = ?');
$stmt->execute([$txId, $user['id']]);
$existing = $stmt->fetch();

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$existing) {
    check_csrf();
    $rating = (int)($_POST['rating'] ?? 0);
    $comment = trim($_POST['comment'] ?? '');
    if ($rating < 1 || $rating > 5) {
        $error = 'Veuillez choisir une note entre 1 et 5 étoiles.';
    } else {
        // Anti-fraude sur le commentaire (masquer téléphones/emails)
        if ($comment) {
            $analysis = analyze_message($comment);
            $comment = $analysis['filtered_content'];
        }
        db()->prepare('INSERT INTO reviews (id, transaction_id, listing_id, reviewer_id, reviewed_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute([uuid(), $txId, $tx['listing_id'], $user['id'], $reviewedId, $rating, $comment ?: null]);
        flash('⭐ Merci pour votre avis ! Il aide la communauté KAPUCE.G.');
        redirect('/dashboard/transactions.php');
    }
}

$pageTitle = 'Noter ' . $reviewedName;
require_once __DIR__ . '/includes/header.php';
?>
<div class="max-w-lg mx-auto px-4 py-12">
    <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h1 class="text-2xl font-extrabold text-gray-900 mb-1">⭐ Noter <?= $isBuyer ? 'le propriétaire' : 'le client' ?></h1>
        <p class="text-sm text-gray-500 mb-6">Transaction : <?= h($tx['listing_title']) ?></p>

        <?php if ($existing): ?>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div class="text-2xl mb-2"><?= str_repeat('★', (int)$existing['rating']) . str_repeat('☆', 5 - (int)$existing['rating']) ?></div>
                <p class="text-sm text-green-800 font-medium">Vous avez déjà noté cette transaction.</p>
                <?php if ($existing['comment']): ?><p class="text-sm text-gray-600 mt-2 italic">« <?= h($existing['comment']) ?> »</p><?php endif; ?>
                <a href="/dashboard/transactions.php" class="inline-block mt-4 text-brand-600 font-semibold text-sm">← Retour aux transactions</a>
            </div>
        <?php else: ?>
        <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <div class="flex items-center gap-3 mb-6 bg-gray-50 rounded-lg p-4">
            <div class="w-11 h-11 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-lg"><?= h(mb_strtoupper(mb_substr($reviewedName, 0, 1))) ?></div>
            <div>
                <div class="font-semibold"><?= h($reviewedName) ?></div>
                <div class="text-xs text-gray-400"><?= $isBuyer ? 'Propriétaire' : 'Client' ?></div>
            </div>
        </div>
        <form method="post">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <label class="block text-sm font-medium text-gray-700 mb-2">Votre note *</label>
            <div class="flex gap-2 mb-5 justify-center" id="stars">
                <?php for ($i = 1; $i <= 5; $i++): ?>
                <label class="cursor-pointer">
                    <input type="radio" name="rating" value="<?= $i ?>" class="sr-only" onchange="paintStars(<?= $i ?>)">
                    <span class="text-4xl text-gray-300 star" data-v="<?= $i ?>">★</span>
                </label>
                <?php endfor; ?>
            </div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
            <textarea name="comment" rows="4" maxlength="500" placeholder="Partagez votre expérience..." class="w-full border border-gray-200 rounded-lg px-3 py-2 mb-1"></textarea>
            <p class="text-xs text-gray-400 mb-4">🛡️ Les coordonnées (téléphone, email) seront automatiquement masquées.</p>
            <button class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-bold">Publier mon avis</button>
        </form>
        <script>
        function paintStars(n) {
            document.querySelectorAll('.star').forEach(s => {
                s.classList.toggle('text-amber-400', parseInt(s.dataset.v) <= n);
                s.classList.toggle('text-gray-300', parseInt(s.dataset.v) > n);
            });
        }
        </script>
        <?php endif; ?>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
