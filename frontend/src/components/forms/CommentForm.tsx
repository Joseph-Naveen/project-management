import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Avatar } from '../ui/Avatar';
import { 
  Send, 
  Paperclip, 
  Smile,
  Image,
  FileText,
  X,
  Loader2,
  AtSign
} from 'lucide-react';
import type { User } from '../../types';

// Form validation schema
const commentFormSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
  attachments: z.array(z.any()).optional()
});

type CommentFormData = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  currentUser: User;
  onSubmit: (data: CommentFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  submitLabel?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  currentUser,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
  placeholder = 'Write a comment...',
  submitLabel = 'Send'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: '',
      attachments: []
    }
  });

  const watchedContent = watch('content');

  // Handle mentions
  const handleMentionTrigger = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (user: User) => {
    const currentContent = watchedContent;
    const lastAtSignIndex = currentContent.lastIndexOf('@');
    const newContent = currentContent.substring(0, lastAtSignIndex) + `@${user.name} ` + currentContent.substring(lastAtSignIndex + mentionQuery.length + 1);
    
    setValue('content', newContent);
    setShowMentions(false);
    setMentionQuery('');
  };

  const filteredUsers: User[] = React.useMemo(() => {
    return []; // No users provided in props, so no filtering
  }, [mentionQuery]);

  // Handle file attachments
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      return file.size <= maxSize;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    setValue('attachments', [...attachments, ...validFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setValue('attachments', newAttachments);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFormSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // Reset form on successful submission
      setValue('content', '');
      setAttachments([]);
      setShowMentions(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* User Info */}
        {currentUser && (
          <div className="flex items-center space-x-3 mb-4">
            <Avatar
              alt={currentUser.name}
              src={currentUser.avatar}
              size="sm"
              className="h-8 w-8"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {currentUser.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser.role}
              </div>
            </div>
          </div>
        )}

        {/* Comment Input */}
        <div className="relative">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder={placeholder}
                rows={3}
                className="resize-none"
                error={errors.content?.message}
                autoFocus={false} // Removed autoFocus prop
                onKeyDown={handleMentionTrigger}
                onChange={(e) => {
                  field.onChange(e);
                  // Update mention query if @ is typed
                  const value = e.target.value;
                  const lastAtSignIndex = value.lastIndexOf('@');
                  if (lastAtSignIndex !== -1) {
                    const query = value.substring(lastAtSignIndex + 1).split(' ')[0];
                    setMentionQuery(query);
                    setShowMentions(true);
                  } else {
                    setShowMentions(false);
                  }
                }}
              />
            )}
          />

          {/* Mentions Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleMentionSelect(user)}
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <Avatar
                    alt={user.name}
                    src={user.avatar}
                    size="sm"
                    className="h-6 w-6"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments ({attachments.length})
            </div>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach
            </Button>

            {/* Emoji Button (placeholder) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isLoading || !watchedContent.trim()}
              className="min-w-[80px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Character Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            {watchedContent.length > 0 && (
              <span>
                {watchedContent.length}/1000 characters
              </span>
            )}
            {attachments.length > 0 && (
              <span>
                {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <AtSign className="h-3 w-3" />
            <span>Use @ to mention users</span>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default CommentForm; 