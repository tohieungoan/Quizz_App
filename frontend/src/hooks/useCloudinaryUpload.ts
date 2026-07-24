import { useState } from 'react';

interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

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
      // 1. Request Signature from our Backend
      // NOTE: In a real app, you MUST include the Admin Authorization token in headers.
      // We assume the user has a valid token stored in localStorage for this demo.
      const token = localStorage.getItem('token'); 
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const sigResponse = await fetch('http://127.0.0.1:8000/api/v1/upload/request-signature', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!sigResponse.ok) {
        const errData = await sigResponse.json();
        throw new Error(errData.detail || 'Failed to get upload signature');
      }

      const sigData: UploadSignatureResponse = await sigResponse.json();

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.api_key);
      formData.append('timestamp', String(sigData.timestamp));
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/auto/upload`;

      // Use native XMLHttpRequest for upload progress without needing axios dependency
      return new Promise((resolve, reject) => {
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
      setError(err.message || 'An error occurred during upload');
      setIsUploading(false);
      return null;
    }
  };

  const deleteFile = async (url: string) => {
    try {
      const token = localStorage.getItem('token'); 
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`http://127.0.0.1:8000/api/v1/upload/delete-asset?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
        headers: headers,
      });
      // We don't necessarily need to handle the response since it's fire-and-forget for drafts
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
