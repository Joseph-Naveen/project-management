import React, { useState } from 'react';
import { 
  MessageSquare, 
   
  Smile, 
  MoreVertical, 
  Reply, 
  Edit2, 
  Trash2,
  Paperclip,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '../../types';
import { UserAvatar } from './UserAvatar';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { useAuthContext } from '../../context/AuthContext';


interface CommentThreadProps {
  comments: Comment[];
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onReaction?: (commentId: string, emoji: string) => void;
  maxDepth?: number;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onReaction?: (commentId: string, emoji: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth = 0,
  maxDepth = 3,
  onReply,
  onEdit,
  onDelete,
  onReaction
}) => {
  const { user } = useAuthContext();
  // const { colors } = useTheme(); // Not used currently
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = user?.id === comment.authorId;
  const canDelete = user?.id === comment.authorId || user?.role === 'admin';

  // Common reaction emojis
  const commonReactions = ['👍', '❤️', '😊', '🎉', '👏', '🔥'];

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;
    
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || !onEdit || editContent === comment.content) return;
    
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setShowEditForm(false);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(comment.id, emoji);
    }
  };

  // Check if user has reacted with specific emoji
  const hasUserReacted = (emoji: string) => {
    if (!user) return false;
    const reaction = comment.reactions.find(r => r.emoji === emoji);
    return reaction?.users.includes(user.id) || false;
  };

  const indentClass = depth > 0 ? 'ml-8 border-l-2 border-gray-100 dark:border-gray-700 pl-4' : '';

  return (
    <div className={indentClass}>
      <div className="group">
        {/* Comment header */}
        <div className="flex items-start gap-3 mb-2">
          <UserAvatar 
            user={comment.author} 
            size="sm" 
            showTooltip={true}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {comment.author.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
              )}
            </div>
            
            {/* Comment content */}
            {showEditForm ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="Edit your comment..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={!editContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                {comment.content}
              </div>
            )}

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mb-2 space-y-1">
                {comment.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Paperclip size={14} />
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {attachment.name}
                    </a>
                    <span className="text-xs text-gray-500">
                      ({(attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Reactions */}
            {comment.reactions && comment.reactions.length > 0 && (
              <div className="flex items-center gap-1 mb-2">
                {comment.reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                      hasUserReacted(reaction.emoji)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {/* Reply button */}
              {depth < maxDepth && onReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Reply size={12} />
                  Reply
                </button>
              )}

              {/* Reaction picker */}
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Smile size={12} />
                  React
                </button>
                
                {showActions && (
                  <div className="absolute top-6 left-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                    <div className="flex gap-1">
                      {commonReactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            handleReaction(emoji);
                            setShowActions(false);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit/Delete actions */}
              {(canEdit || canDelete) && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-opacity"
                  >
                    <MoreVertical size={12} />
                  </button>
                  
                  {showActions && (
                    <div className="absolute top-6 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setShowEditForm(true);
                            setShowActions(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      )}
                      
                      {canDelete && (
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowActions(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && onReply && (
          <div className="ml-11 mt-3 space-y-2">
            <div className="flex items-start gap-2">
              <UserAvatar 
                user={user!} 
                size="sm" 
              />
              <div className="flex-1">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="resize-none"
                  placeholder="Write a reply..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    <Send size={12} className="mr-1" />
                    {isSubmitting ? 'Sending...' : 'Reply'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReaction={onReaction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  maxDepth = 3,
  className = ''
}) => {
  // Organize comments into a threaded structure
  const organizeComments = (comments: Comment[]) => {
    const topLevel = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);
    
    // Build the threaded structure
    const buildReplies = (parentId: string): Comment[] => {
      return replies
        .filter(c => c.parentId === parentId)
        .map(comment => ({
          ...comment,
          replies: buildReplies(comment.id)
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    return topLevel
      .map(comment => ({
        ...comment,
        replies: buildReplies(comment.id)
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const threadedComments = organizeComments(comments);

  if (threadedComments.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {threadedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          maxDepth={maxDepth}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onReaction={onReaction}
        />
      ))}
    </div>
  );
};

// Comment form for adding new comments
interface CommentFormProps {
  onSubmit: (content: string, attachments?: File[]) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  placeholder = "Write a comment...",
  loading = false,
  className = ''
}) => {
  const { user } = useAuthContext();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      await onSubmit(content.trim(), attachments);
      setContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!user) return null;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <UserAvatar user={user} size="sm" />
        
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder={placeholder}
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-1">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Paperclip size={14} />
                  <span>{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={14} className="mr-1" />
                Attach
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              size="sm"
            >
              <Send size={14} className="mr-1" />
              {loading ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};