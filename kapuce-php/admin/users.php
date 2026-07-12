<?php
$pageTitle = 'Utilisateurs';
require_once __DIR__ . '/_header.php';

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $id = $_POST['user_id'] ?? '';
    $action = $_POST['action'] ?? '';
    if ($action === 'ban') {
        $pdo->prepare("UPDATE users SET is_banned = 1, ban_reason = ?, banned_at = NOW() WHERE id = ? AND role NOT IN ('SUPER_ADMIN')")->execute([trim($_POST['reason'] ?? 'Violation des règles'), $id]);
        flash('Utilisateur banni.');
    } elseif ($action === 'unban') {
        $pdo->prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?')->execute([$id]);
        flash('Utilisateur réactivé.');
    } elseif ($action === 'set_commission' && $admin['role'] === 'SUPER_ADMIN') {
        $rate = $_POST['rate'] === '' ? null : max(0, min(50, (float)$_POST['rate']));
        $pdo->prepare('UPDATE users SET custom_commission_rate = ? WHERE id = ?')->execute([$rate, $id]);
        flash('Commission personnalisée mise à jour.');
    }
    redirect('/admin/users.php');
}

$q = trim($_GET['q'] ?? '');
$sql = 'SELECT * FROM users';
$params = [];
if ($q) { $sql .= ' WHERE full_name LIKE ? OR email LIKE ?'; $params = ["%$q%", "%$q%"]; }
$sql .= ' ORDER BY created_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();
$riskColors = ['NONE' => 'bg-gray-100 text-gray-500', 'LOW' => 'bg-yellow-100 text-yellow-700', 'MEDIUM' => 'bg-amber-100 text-amber-700', 'HIGH' => 'bg-orange-100 text-orange-700', 'CRITICAL' => 'bg-red-100 text-red-700'];
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <h1 class="text-2xl font-extrabold text-gray-900">Utilisateurs (<?= count($users) ?>)</h1>
        <form method="get" class="flex gap-2">
            <input type="text" name="q" value="<?= h($q) ?>" placeholder="Rechercher nom ou email..." class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <button class="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">Rechercher</button>
        </form>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-gray-500">
                <tr><th class="px-4 py-3">Utilisateur</th><th class="px-4 py-3">Rôle</th><th class="px-4 py-3">Risque fraude</th><th class="px-4 py-3">Commission perso.</th><th class="px-4 py-3">Statut</th><th class="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($users as $u): ?>
                <tr class="border-t border-gray-100">
                    <td class="px-4 py-3">
                        <div class="font-semibold"><?= h($u['full_name']) ?></div>
                        <div class="text-xs text-gray-400"><?= h($u['email']) ?> • <?= h($u['phone']) ?></div>
                    </td>
                    <td class="px-4 py-3"><span class="text-xs font-bold bg-gray-100 px-2 py-1 rounded"><?= h($u['role']) ?></span></td>
                    <td class="px-4 py-3">
                        <span class="text-xs font-bold px-2 py-1 rounded <?= $riskColors[$u['fraud_risk_level']] ?? '' ?>"><?= h($u['fraud_risk_level']) ?></span>
                        <span class="text-xs text-gray-400">(<?= (int)$u['fraud_alert_count'] ?> alertes)</span>
                    </td>
                    <td class="px-4 py-3">
                        <?php if ($admin['role'] === 'SUPER_ADMIN' && !is_admin($u)): ?>
                        <form method="post" class="flex gap-1 items-center">
                            <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="user_id" value="<?= h($u['id']) ?>"><input type="hidden" name="action" value="set_commission">
                            <input type="number" step="0.5" min="0" max="50" name="rate" value="<?= h($u['custom_commission_rate']) ?>" placeholder="défaut" class="w-20 border border-gray-200 rounded px-2 py-1 text-xs">
                            <button class="text-xs bg-gray-800 text-white rounded px-2 py-1">OK</button>
                        </form>
                        <?php else: ?>-<?php endif; ?>
                    </td>
                    <td class="px-4 py-3"><?= $u['is_banned'] ? '<span class="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">BANNI</span>' : '<span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Actif</span>' ?></td>
                    <td class="px-4 py-3">
                        <?php if ($u['role'] !== 'SUPER_ADMIN'): ?>
                        <?php if (!$u['is_banned']): ?>
                        <form method="post" onsubmit="const r = prompt('Motif du bannissement :'); if (!r) return false; this.reason.value = r;">
                            <input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="user_id" value="<?= h($u['id']) ?>"><input type="hidden" name="action" value="ban"><input type="hidden" name="reason" value="">
                            <button class="text-xs border border-red-200 text-red-600 rounded px-3 py-1 font-semibold">Bannir</button>
                        </form>
                        <?php else: ?>
                        <form method="post"><input type="hidden" name="csrf" value="<?= csrf_token() ?>"><input type="hidden" name="user_id" value="<?= h($u['id']) ?>"><input type="hidden" name="action" value="unban">
                            <button class="text-xs border border-green-200 text-green-600 rounded px-3 py-1 font-semibold">Réactiver</button></form>
                        <?php endif; ?>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
</body></html>
