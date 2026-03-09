import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Fonction utilitaire pour uploader un fichier
export async function uploadToCloudinary(file, options = {}) {
  const defaultOptions = {
    folder: 'kama',
    resource_type: 'auto',
    ...options,
  };

  try {
    const result = await cloudinary.uploader.upload(file, defaultOptions);
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Erreur Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Fonction pour supprimer un fichier
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return { success: result.result === 'ok' };
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    return { success: false, error: error.message };
  }
}

// Générer une signature pour l'upload côté client
export function generateUploadSignature(paramsToSign) {
  return cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );
}
