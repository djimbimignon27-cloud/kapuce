<?php
$pageTitle = 'Alertes Fraude';
require_once __DIR__ . '/_header.php';

// Actions sur les alertes
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $alertId = $_POST['alert_id'] ?? '';
    $action = $_POST['action'] ?? '';
    $stmt = $pdo->prepare('SELECT * FROM fraud_alerts WHERE id = ?');
    $stmt->execute([$alertId]);
    $alert = $stmt->fetch();
    if ($alert) {
        if ($action === 'review') {
            $pdo->prepare("UPDATE fraud_alerts SET status = 'REVIEWED' WHERE id = ?")->execute([$alertId]);
            flash('Alerte marquée comme examinée.');
        } elseif ($action === 'dismiss') {
            $pdo->prepare("UPDATE fraud_alerts SET status = 'DISMISSED' WHERE id = ?")->execute([$alertId]);
            flash('Alerte ignorée (fausse alerte).');
        } elseif ($action === 'ban_user') {
            $pdo->prepare("UPDATE fraud_alerts SET status = 'ACTION_TAKEN' WHERE id = ?")->execute([$alertId]);
            $pdo->prepare("UPDATE users SET is_banned = 1, ban_reason = 'Fraude détectée (tentative de contournement de la plateforme)', banned_at = NOW() WHERE id = ? AND role NOT IN ('SUPER_ADMIN')")->execute([$alert['user_id']]);
            flash('⛔ Utilisateur banni et alerte traitée.');
        }
    }
    redirect('/admin/alerts.php?filter=' . urlencode($_GET['filter'] ?? 'PENDING'));
}

// Stats par statut ('NEW' historique = PENDING)
$statStmt = $pdo->query("SELECT CASE WHEN status = 'NEW' THEN 'PENDING' ELSE status END AS s, COUNT(*) AS c FROM fraud_alerts GROUP BY s");
$alertStats = ['PENDING' => 0, 'REVIEWED' => 0, 'DISMISSED' => 0, 'ACTION_TAKEN' => 0];
foreach ($statStmt->fetchAll() as $row) { $alertStats[$row['s']] = (int)$row['c']; }

$filter = $_GET['filter'] ?? 'PENDING';
$sql = "SELECT fa.*, u.full_name, u.email, u.fraud_risk_level, u.fraud_alert_count, u.is_banned FROM fraud_alerts fa JOIN users u ON u.id = fa.user_id";
$params = [];
if ($filter !== 'ALL') {
    $sql .= $filter === 'PENDING' ? " WHERE fa.status IN ('PENDING','NEW')" : ' WHERE fa.status = ?';
    if ($filter !== 'PENDING') $params[] = $filter;
}
$sql .= ' ORDER BY fa.created_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$alerts = $stmt->fetchAll();

$sevColors = ['LOW' => 'bg-yellow-100 text-yellow-700', 'MEDIUM' => 'bg-amber-100 text-amber-700', 'HIGH' => 'bg-orange-100 text-orange-700', 'CRITICAL' => 'bg-red-100 text-red-700'];
$typeLabels = ['PHONE_NUMBER' => '📞 Numéro de téléphone', 'EMAIL' => '✉️ Email', 'WHATSAPP' => '💬 Messagerie externe', 'EXTERNAL_PAYMENT' => '💸 Paiement hors plateforme', 'OTHER' => 'Autre'];
?>
<!-- Stats -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <a href="?filter=PENDING" class="bg-white rounded-2xl shadow-lg p-5 border-2 <?= $filter === 'PENDING' ? 'border-yellow-400' : 'border-transparent' ?> hover:shadow-xl transition">
        <p class="text-3xl font-black text-yellow-500"><?= $alertStats['PENDING'] ?></p>
        <p class="text-sm text-gray-500 font-medium">En attente</p>
    </a>
    <a href="?filter=REVIEWED" class="bg-white rounded-2xl shadow-lg p-5 border-2 <?= $filter === 'REVIEWED' ? 'border-blue-400' : 'border-transparent' ?> hover:shadow-xl transition">
        <p class="text-3xl font-black text-blue-500"><?= $alertStats['REVIEWED'] ?></p>
        <p class="text-sm text-gray-500 font-medium">Examinées</p>
    </a>
    <a href="?filter=DISMISSED" class="bg-white rounded-2xl shadow-lg p-5 border-2 <?= $filter === 'DISMISSED' ? 'border-green-400' : 'border-transparent' ?> hover:shadow-xl transition">
        <p class="text-3xl font-black text-green-500"><?= $alertStats['DISMISSED'] ?></p>
        <p class="text-sm text-gray-500 font-medium">Ignorées</p>
    </a>
    <a href="?filter=ACTION_TAKEN" class="bg-white rounded-2xl shadow-lg p-5 border-2 <?= $filter === 'ACTION_TAKEN' ? 'border-red-400' : 'border-transparent' ?> hover:shadow-xl transition">
        <p class="text-3xl font-black text-red-500"><?= $alertStats['ACTION_TAKEN'] ?></p>
        <p class="text-sm text-gray-500 font-medium">Actions prises</p>
    </a>
</div>

<div class="flex gap-2 mb-6">
    <a href="?filter=ALL" class="px-4 py-2 rounded-xl text-sm font-semibold <?= $filter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600' ?>">Toutes les alertes</a>
</div>

<?php if (!$alerts): ?>
<div class="bg-white rounded-2xl shadow-lg border border-dashed border-gray-200 p-16 text-center">
    <div class="text-5xl mb-4">🛡️</div>
    <p class="text-gray-500 font-medium">Aucune alerte dans cette catégorie.</p>
</div>
<?php endif; ?>

<div class="space-y-4">
    <?php foreach ($alerts as $a): $isPending = in_array($a['status'], ['PENDING', 'NEW']); ?>
    <div class="bg-white rounded-2xl shadow-lg border <?= $isPending ? 'border-red-200' : 'border-gray-100' ?> p-5">
        <div class="flex flex-col lg:flex-row justify-between gap-4">
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full <?= $sevColors[$a['severity']] ?? 'bg-gray-100' ?>"><?= h($a['severity']) ?></span>
                    <span class="text-xs font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full"><?= $typeLabels[$a['alert_type']] ?? h($a['alert_type']) ?></span>
                    <?php if ($isPending): ?><span class="text-xs text-red-600 font-bold animate-pulse">● EN ATTENTE</span><?php endif; ?>
                    <span class="text-xs text-gray-400"><?= time_ago($a['created_at']) ?></span>
                </div>
                <div class="text-sm mb-1">
                    <strong><?= h($a['full_name']) ?></strong> <span class="text-gray-400">(<?= h($a['email']) ?>)</span>
                    <?php if ($a['is_banned']): ?><span class="ml-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">BANNI</span><?php endif; ?>
                </div>
                <div class="text-xs text-gray-500 mb-2">Niveau de risque : <strong class="text-red-600"><?= h($a['fraud_risk_level']) ?></strong> • <?= (int)$a['fraud_alert_count'] ?> alertes au total</div>
                <div class="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-gray-700">
                    <span class="text-xs text-red-500 font-bold block mb-1">CONTENU ORIGINAL DÉTECTÉ :</span>
                    <?= h($a['detected_content']) ?>
                </div>
                <?php if ($a['conversation_id']): ?><a href="/admin/messages.php?conv=<?= h($a['conversation_id']) ?>" class="inline-block mt-2 text-xs text-kama-blue font-bold hover:underline">Voir la conversation complète →</a><?php endif; ?>
            </div>
            <?php if ($isPending): ?>
            <div class="flex lg:flex-col gap-2 justify-end flex-shrink-0">
                <form method="post">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="alert_id" value="<?= h($a['id']) ?>"><input type="hidden" name="action" value="review">
                    <button class="w-full text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 font-semibold whitespace-nowrap">✓ Examinée</button>
                </form>
                <form method="post">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="alert_id" value="<?= h($a['id']) ?>"><input type="hidden" name="action" value="dismiss">
                    <button class="w-full text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2 font-semibold whitespace-nowrap">Ignorer</button>
                </form>
                <?php if (!$a['is_banned']): ?>
                <form method="post" onsubmit="return confirm('Bannir cet utilisateur pour fraude ?')">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="alert_id" value="<?= h($a['id']) ?>"><input type="hidden" name="action" value="ban_user">
                    <button class="w-full text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-2 font-bold whitespace-nowrap">⛔ Bannir</button>
                </form>
                <?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endforeach; ?>
</div>
<?php require_once __DIR__ . '/_footer.php'; ?>
