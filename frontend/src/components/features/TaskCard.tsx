import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  User, 
  Flag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import type { Task } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

import { useAuthContext } from '../../context/AuthContext';
import { formatDistanceToNow, format, isPast } from 'date-fns';

interface TaskCardProps {
  task: Task;
  viewMode?: 'kanban' | 'list' | 'compact';
  showProject?: boolean;
  isDragging?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, status: Task['status']) => void;
  onAssigneeChange?: (task: Task, assigneeId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  viewMode = 'kanban',
  showProject = false,
  isDragging = false,
  onEdit,
  onDelete,
  // onStatusChange,
  // onAssigneeChange,
  className = '',
  style
}) => {
  // const { colors } = useTheme(); // Not used currently
  const { canEditTask, canDeleteTask } = useAuthContext();
  
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get priority color and icon
  /*const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };*/

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle size={12} className="text-red-500" />;
      case 'high':
        return <Flag size={12} className="text-orange-500" />;
      case 'medium':
        return <Flag size={12} className="text-blue-500" />;
      case 'low':
        return <Flag size={12} className="text-gray-400" />;
      default:
        return null;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={14} className="text-blue-500" />;
      case 'review':
        return <AlertTriangle size={14} className="text-orange-500" />;
      default:
        return <Circle size={14} className="text-gray-400" />;
    }
  };

  // Check if task is overdue
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'done';
  const dueDateText = dueDate ? formatDistanceToNow(dueDate, { addSuffix: true }) : null;

  // Check user permissions
  const canEdit = canEditTask(task.creatorId, task.assigneeId);
  const canDelete = canDeleteTask(task.creatorId);

  // Format counts
  const commentCount = task.commentCount || 0;
  const attachmentCount = task.attachments?.length || 0;
  const timeLogCount = task.timeLogCount || 0;

  // Base card classes
  const cardClasses = `
    group cursor-pointer transition-all duration-200 
    ${isDragging ? 'shadow-lg rotate-2 opacity-75' : 'hover:shadow-md'}
    ${isOverdue ? 'border-l-4 border-red-500' : ''}
    ${className}
  `;

  // Kanban view (default)
  if (viewMode === 'kanban') {
    return (
      <Card className={cardClasses} style={style}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getPriorityIcon(task.priority)}
              <Link 
                to={`/tasks/${task.id}`}
                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 text-sm"
              >
                {task.title}
              </Link>
            </div>

            {(canEdit || canDelete) && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDropdown(!showDropdown);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                >
                  <MoreVertical size={12} />
                </Button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-6 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {onEdit && canEdit && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onEdit(task);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Edit Task
                      </button>
                    )}
                    
                    {onDelete && canDelete && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onDelete(task);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Project name (if shown) */}
          {showProject && task.project && (
            <div className="mb-3">
              <Badge color="secondary" size="sm" variant="outline">
                {task.project.name}
              </Badge>
            </div>
          )}

          {/* Labels/Tags */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.labels.slice(0, 3).map((label) => (
                <Badge 
                  key={label} 
                  size="sm" 
                  variant="outline"
                  className="text-xs"
                >
                  {label}
                </Badge>
              ))}
              {task.labels.length > 3 && (
                <Badge size="sm" variant="outline" className="text-xs">
                  +{task.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Due date */}
          {dueDate && (
            <div className="flex items-center gap-1 mb-3">
              <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
              <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                {dueDateText}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Assignee */}
            <div className="flex items-center">
              {task.assignee ? (
                <Avatar
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  size="sm"
                  className="w-6 h-6"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User size={12} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Counts */}
            <div className="flex items-center gap-3">
              {commentCount > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageSquare size={12} />
                  <span className="text-xs">{commentCount}</span>
                </div>
              )}
              
              {attachmentCount > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Paperclip size={12} />
                  <span className="text-xs">{attachmentCount}</span>
                </div>
              )}
              
              {timeLogCount > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={12} />
                  <span className="text-xs">{timeLogCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // List view
  if (viewMode === 'list') {
    return (
      <Card className={`group hover:shadow-md transition-shadow duration-200 ${className}`} style={style}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Status icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(task.status)}
              </div>

              {/* Task info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityIcon(task.priority)}
                  <Link 
                    to={`/tasks/${task.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {task.title}
                  </Link>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Project */}
              {showProject && task.project && (
                <div className="flex-shrink-0">
                  <Badge color="secondary" size="sm" variant="outline">
                    {task.project.name}
                  </Badge>
                </div>
              )}

              {/* Assignee */}
              <div className="flex-shrink-0">
                {task.assignee ? (
                  <Avatar
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    size="sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User size={14} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Due date */}
              <div className="flex-shrink-0 min-w-0">
                {dueDate && (
                  <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    {dueDateText}
                  </span>
                )}
              </div>

              {/* Counts */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {commentCount > 0 && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MessageSquare size={14} />
                    <span className="text-sm">{commentCount}</span>
                  </div>
                )}
                
                {attachmentCount > 0 && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Paperclip size={14} />
                    <span className="text-sm">{attachmentCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {(canEdit || canDelete) && (
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={16} />
                </Button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-8 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    {onEdit && canEdit && (
                      <button
                        onClick={() => {
                          onEdit(task);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Edit Task
                      </button>
                    )}
                    
                    {onDelete && canDelete && (
                      <button
                        onClick={() => {
                          onDelete(task);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Compact view
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`} style={style}>
      {/* Status */}
      <div className="flex-shrink-0">
        {getStatusIcon(task.status)}
      </div>

      {/* Priority */}
      <div className="flex-shrink-0">
        {getPriorityIcon(task.priority)}
      </div>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <Link 
          to={`/tasks/${task.id}`}
          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
        >
          {task.title}
        </Link>
      </div>

      {/* Assignee */}
      {task.assignee && (
        <div className="flex-shrink-0">
          <Avatar
            src={task.assignee.avatar}
            alt={task.assignee.name}
            size="sm"
            className="w-6 h-6"
          />
        </div>
      )}

      {/* Due date */}
      {dueDate && (
        <div className="flex-shrink-0">
          <span className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
            {format(dueDate, 'MMM d')}
          </span>
        </div>
      )}
    </div>
  );
};