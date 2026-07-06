<?php
require_once __DIR__ . '/../config.php';

/**
 * Upload d'un fichier vers Cloudinary (upload signé)
 * @param string $filePath  Chemin temporaire du fichier ($_FILES['x']['tmp_name'])
 * @param string $resourceType 'image' ou 'video'
 * @return array|null ['url' => ..., 'public_id' => ...] ou null si échec
 */
function cloudinary_upload($filePath, $resourceType = 'image') {
    $timestamp = time();
    $folder = 'kapuce';
    $paramsToSign = 'folder=' . $folder . '&timestamp=' . $timestamp;
    $signature = sha1($paramsToSign . CLOUDINARY_API_SECRET);

    $url = 'https://api.cloudinary.com/v1_1/' . CLOUDINARY_CLOUD_NAME . '/' . $resourceType . '/upload';

    $postFields = [
        'file' => new CURLFile($filePath),
        'api_key' => CLOUDINARY_API_KEY,
        'timestamp' => $timestamp,
        'folder' => $folder,
        'signature' => $signature,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_TIMEOUT => 120,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        error_log('Cloudinary upload failed: HTTP ' . $httpCode . ' - ' . $response);
        return null;
    }
    $data = json_decode($response, true);
    if (empty($data['secure_url'])) return null;
    return ['url' => $data['secure_url'], 'public_id' => $data['public_id'] ?? ''];
}
