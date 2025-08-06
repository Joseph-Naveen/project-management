import React, { useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  Check,
  AlertCircle,
  Loader2,
  Cloud,
  Trash2
} from 'lucide-react';

// Form validation schema
const fileUploadFormSchema = z.object({
  files: z.array(z.any()).min(1, 'At least one file is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional()
});

type FileUploadFormData = z.infer<typeof fileUploadFormSchema>;

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FileUploadFormData) => Promise<void>;
  isLoading?: boolean;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  multiple?: boolean;
  title?: string;
  description?: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  multiple = true,
  title = 'Upload Files',
  description = 'Drag and drop files here or click to browse'
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FileUploadFormData>({
    resolver: zodResolver(fileUploadFormSchema),
    defaultValues: {
      files: [],
      description: '',
      tags: []
    }
  });

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)}`;
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'File type not allowed';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors[file.name] = error;
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      setValue('files', updatedFiles);
    }

    if (Object.keys(newErrors).length > 0) {
      setUploadErrors(prev => ({ ...prev, ...newErrors }));
    }
  };

  const removeFile = (fileToRemove: File) => {
    const updatedFiles = files.filter(file => file !== fileToRemove);
    setFiles(updatedFiles);
    setValue('files', updatedFiles);
    
    // Remove from progress and errors
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
    
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileToRemove.name];
      return newErrors;
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    }
    if (file.type.startsWith('video/')) {
      return <Video className="h-5 w-5" />;
    }
    if (file.type.startsWith('audio/')) {
      return <Music className="h-5 w-5" />;
    }
    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('tar')) {
      return <Archive className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (file: File) => {
    if (file.type.startsWith('image/')) return 'text-green-600';
    if (file.type.startsWith('video/')) return 'text-purple-600';
    if (file.type.startsWith('audio/')) return 'text-blue-600';
    if (file.type.includes('pdf')) return 'text-red-600';
    if (file.type.includes('word') || file.type.includes('document')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const handleFormSubmit = async (data: FileUploadFormData) => {
    try {
      // Simulate upload progress for each file
      let completedFiles = 0;

      for (const file of data.files) {
        setUploadProgress(prev => ({ ...prev, [(file as File).name]: 0 }));
        
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setUploadProgress(prev => ({ ...prev, [(file as File).name]: i }));
        }
        
        completedFiles++;
      }

      await onSubmit(data);
      
      // Reset form on successful submission
      setFiles([]);
      setValue('files', []);
      setUploadProgress({});
      setUploadErrors({});
      onClose();
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const hasErrors = Object.keys(uploadErrors).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragOver ? 'Drop files here' : 'Upload Files'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
              <p>Supported formats: {allowedTypes.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Selected Files ({files.length})
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total: {formatFileSize(totalSize)}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => {
                const progress = uploadProgress[file.name] || 0;
                const error = uploadErrors[file.name];
                const isUploading = isSubmitting && progress < 100;
                const isCompleted = progress === 100;

                return (
                  <div
                    key={`${file.name}-${file.size}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      error
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`${getFileTypeColor(file)}`}>
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          {error && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="success" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                        {error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {error}
                          </p>
                        )}
                        {isUploading && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {progress}% uploaded
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      className="text-red-500 hover:text-red-700 ml-2"
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                placeholder="Add a description for these files..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            )}
          />
          {errors.description && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Error Summary */}
        {hasErrors && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                Some files could not be uploaded
              </span>
            </div>
            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
              {Object.entries(uploadErrors).map(([fileName, error]) => (
                <li key={fileName}>
                  <strong>{fileName}:</strong> {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting || isLoading || files.length === 0}
          className="min-w-[100px]"
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files ({files.length})
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FileUploadModal; 