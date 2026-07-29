import { useState } from 'react';
import { uploadService } from '@/services';

const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);

    try {
      // 1. Request Signature from our Backend using uploadService
      const sigData = await uploadService.requestSignature({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.api_key);
      formData.append('timestamp', String(sigData.timestamp));
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const cloudinaryUrl = `${CLOUDINARY_URL}/${sigData.cloud_name}/auto/upload`;

      // Use native XMLHttpRequest for upload progress tracking
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentCompleted = Math.round((event.loaded * 100) / event.total);
            setProgress(percentCompleted);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              setUploadedUrl(response.secure_url);
              setIsUploading(false);
              resolve(response.secure_url);
            } catch (err) {
              setError('Failed to parse upload response');
              setIsUploading(false);
              resolve(null);
            }
          } else {
            setError(`Upload failed with status ${xhr.status}`);
            setIsUploading(false);
            resolve(null);
          }
        });

        xhr.addEventListener('error', () => {
          setError('Network error occurred during upload');
          setIsUploading(false);
          resolve(null);
        });

        xhr.open('POST', cloudinaryUrl, true);
        xhr.send(formData);
      });

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.response?.data?.detail || err.message || 'An error occurred during upload');
      setIsUploading(false);
      return null;
    }
  };

  const deleteFile = async (url: string) => {
    try {
      await uploadService.deleteAsset(url);
    } catch (err) {
      console.error("Failed to delete orphaned asset:", err);
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    progress,
    error,
    uploadedUrl,
    resetUpload: () => {
      setProgress(0);
      setError(null);
      setUploadedUrl(null);
      setIsUploading(false);
    }
  };
};