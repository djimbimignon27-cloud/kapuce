import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

// Configuration pour accepter les fichiers volumineux
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// POST - Upload d'un fichier (base64)
export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { file, type = 'image', folder = 'kama/listings' } = body;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

    let resourceType = 'image';
    let uploadFolder = folder;

    if (type === 'document') {
      resourceType = 'auto';
      uploadFolder = 'kama/documents';
    } else if (type === 'video') {
      resourceType = 'video';
      uploadFolder = 'kama/videos';
    }

    // Options d'upload
    const uploadOptions = {
      folder: uploadFolder,
      resource_type: resourceType,
    };

    // Ajouter des transformations pour les images
    if (type === 'image') {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ];
    }

    const result = await uploadToCloudinary(file, uploadOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'upload' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un fichier
export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const resourceType = searchParams.get('resourceType') || 'image';

    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId requis' },
        { status: 400 }
      );
    }

    const result = await deleteFromCloudinary(publicId, resourceType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
