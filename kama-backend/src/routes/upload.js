const express = require('express');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload
router.post('/', auth, async (req, res) => {
  try {
    const { file, folder = 'kama' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Fichier requis' });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: `kama/${folder}`,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    res.json({
      success: true,
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
      },
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors du téléversement' });
  }
});

// DELETE /api/upload/:publicId
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Fichier supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;
