'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Image, FileText, Video, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function FileUploader({
  onUpload,
  onRemove,
  maxFiles = 5,
  acceptedTypes = 'image',
  existingFiles = [],
  label = 'Photos',
  description = 'Glissez vos fichiers ici ou cliquez pour sélectionner',
}) {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  const getAcceptedMimeTypes = () => {
    switch (acceptedTypes) {
      case 'image':
        return {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        };
      case 'document':
        return {
          'application/pdf': ['.pdf'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
        };
      case 'video':
        return {
          'video/mp4': ['.mp4'],
          'video/quicktime': ['.mov'],
        };
      default:
        return {};
    }
  };

  const uploadFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const token = localStorage.getItem('accessToken');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              file: base64,
              type: acceptedTypes,
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            resolve({
              ...data.file,
              name: file.name,
              preview: data.file.url,
            });
          } else {
            reject(new Error(data.error || 'Erreur d\'upload'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Gérer les fichiers rejetés
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => ({
        name: file.name,
        error: errors.map(e => e.message).join(', '),
      }));
      setErrors(prev => [...prev, ...newErrors]);
      return;
    }

    // Vérifier la limite
    if (files.length + acceptedFiles.length > maxFiles) {
      setErrors(prev => [...prev, {
        name: 'Limite atteinte',
        error: `Maximum ${maxFiles} fichiers autorisés`,
      }]);
      return;
    }

    setUploading(true);
    setErrors([]);

    const newFiles = [];
    
    for (const file of acceptedFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Simuler la progression
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 10, 90),
          }));
        }, 100);

        const uploadedFile = await uploadFile(file);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        newFiles.push(uploadedFile);
      } catch (error) {
        setErrors(prev => [...prev, {
          name: file.name,
          error: error.message,
        }]);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      if (onUpload) {
        onUpload(updatedFiles);
      }
    }

    setUploading(false);
    setUploadProgress({});
  }, [files, maxFiles, onUpload, acceptedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedMimeTypes(),
    maxSize: acceptedTypes === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
    disabled: files.length >= maxFiles || uploading,
  });

  const removeFile = (index) => {
    const fileToRemove = files[index];
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    if (onRemove) {
      onRemove(fileToRemove, newFiles);
    }
    if (onUpload) {
      onUpload(newFiles);
    }
  };

  const getIcon = () => {
    switch (acceptedTypes) {
      case 'document':
        return <FileText className="w-10 h-10 text-gray-400" />;
      case 'video':
        return <Video className="w-10 h-10 text-gray-400" />;
      default:
        return <Image className="w-10 h-10 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-gray-700 font-semibold">{label}</label>
        <span className="text-sm text-gray-500">{files.length}/{maxFiles}</span>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragActive ? 'border-kama-gold bg-kama-gold/5' : 'border-gray-300 hover:border-kama-gold/50'}
          ${files.length >= maxFiles || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          {uploading ? (
            <Loader2 className="w-10 h-10 text-kama-gold animate-spin" />
          ) : (
            getIcon()
          )}
          
          <p className="mt-4 text-gray-600">
            {isDragActive ? (
              'Déposez les fichiers ici...'
            ) : uploading ? (
              'Upload en cours...'
            ) : (
              description
            )}
          </p>
          
          <p className="mt-2 text-sm text-gray-400">
            {acceptedTypes === 'image' && 'JPG, PNG, WebP (max 10MB)'}
            {acceptedTypes === 'document' && 'PDF, JPG, PNG (max 10MB)'}
            {acceptedTypes === 'video' && 'MP4, MOV (max 50MB)'}
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="flex items-center gap-3">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm text-gray-500 w-12">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{error.name}:</strong> {error.error}</span>
              <button 
                onClick={() => setErrors(prev => prev.filter((_, i) => i !== index))}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className={`grid gap-4 ${acceptedTypes === 'video' ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
          {files.map((file, index) => (
            <div key={index} className="relative group">
              {acceptedTypes === 'video' ? (
                <video
                  src={file.url || file.preview}
                  className="w-full h-48 object-cover rounded-xl"
                  controls
                />
              ) : acceptedTypes === 'document' ? (
                <div className="w-full h-32 bg-gray-100 rounded-xl flex flex-col items-center justify-center p-4">
                  <FileText className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 text-center truncate w-full">{file.name}</p>
                </div>
              ) : (
                <img
                  src={file.url || file.preview}
                  alt={file.name || 'Preview'}
                  className="w-full h-32 object-cover rounded-xl"
                />
              )}
              
              {/* Success badge */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              
              {/* Remove button */}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
