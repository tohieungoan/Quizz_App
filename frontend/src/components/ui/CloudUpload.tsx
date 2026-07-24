import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { UploadCloud, FileVideo, FileAudio, FileImage, X, Eye } from 'lucide-react';

export interface CloudUploadRef {
  openDialog: () => void;
  reset: () => void;
}

interface CloudUploadProps {
  onFileSelect: (file: File | null) => void;
  acceptedTypes?: string;
  label?: string;
  className?: string;
  initialPreviewUrl?: string;
  hideDropzone?: boolean;
  file?: File | null;
}

export const CloudUpload = forwardRef<CloudUploadRef, CloudUploadProps>(({
  onFileSelect,
  acceptedTypes = 'image/*,video/*,audio/*',
  label = 'Click or drag file to this area to upload',
  className = '',
  initialPreviewUrl,
  hideDropzone = false,
  file = null,
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  
  // Create object URL for file preview
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [file]);

  const currentPreviewUrl = objectUrl || initialPreviewUrl || null;

  useImperativeHandle(ref, () => ({
    openDialog: () => {
      fileInputRef.current?.click();
    },
    reset: () => {
      onFileSelect(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (newFile: File) => {
    onFileSelect(newFile);
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderContent = () => {
    const isImage = currentPreviewUrl && (file?.type.startsWith('image/') || initialPreviewUrl);

    return (
      <div className="flex flex-col items-center justify-center min-h-[80px] p-4">
        {!file && !currentPreviewUrl ? (
          <>
            <UploadCloud className="w-8 h-8 text-primary/60 mb-2" />
            <p className="text-sm font-bold text-on-surface mb-1">{label}</p>
            <p className="text-xs text-on-surface-variant">Max 50MB</p>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-between bg-surface-container-low p-2 rounded-lg">
            <div className="flex items-center gap-3 overflow-hidden">
              {(() => {
                if (isImage) return <FileImage className="w-8 h-8 text-blue-500 shrink-0" />;
                if (file?.type.startsWith('video/')) return <FileVideo className="w-8 h-8 text-purple-500 shrink-0" />;
                if (file?.type.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-green-500 shrink-0" />;
                return <UploadCloud className="w-8 h-8 text-primary/60 shrink-0" />;
              })()}
              <p className="text-sm font-bold text-on-surface truncate max-w-[150px] sm:max-w-[200px]">
                {file?.name || 'Current Media'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLightbox(true);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem trước
                </button>
              )}
              {!isImage && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1.5 rounded-md hidden sm:inline-block">Click to change</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-error hover:bg-error/10 rounded-md transition-colors border border-error/20 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Gỡ
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full ${className} ${(!file && !currentPreviewUrl && hideDropzone) ? 'hidden' : ''}`}>
      <div
        className={`relative border-2 border-dashed rounded-xl text-center transition-all cursor-pointer overflow-hidden
          ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-outline-variant hover:border-primary/50'}
          ${(currentPreviewUrl && (file?.type.startsWith('image/') || initialPreviewUrl)) ? 'border-transparent shadow-md' : 'bg-surface-container-lowest'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
        />
        
        {(!file && !currentPreviewUrl && hideDropzone) ? null : renderContent()}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && currentPreviewUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={currentPreviewUrl} 
              alt="Preview Fullscreen" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
            />
          </div>
        </div>
      )}
    </div>
  );
});
