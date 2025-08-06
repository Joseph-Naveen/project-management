import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, MoreVertical, Eye, Edit, Trash2, Star } from 'lucide-react';
import type { Project } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { calculateProjectProgress } from '../../utils/progressCalculations';

import { useAuthContext } from '../../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  viewMode?: 'grid' | 'list';
  showActions?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onToggleFavorite?: (project: Project) => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode = 'grid',
  showActions = true,
  onEdit,
  onDelete,
  onToggleFavorite,
  className = ''
}) => {
  // const { colors } = useTheme(); // Not used currently
  const { canManageProjects, user } = useAuthContext();
  
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

  // Get status color and styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'on_hold':
        return 'warning';
      case 'planning':
        return 'secondary';
      case 'cancelled':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
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
  };

  // Calculate progress percentage using dynamic calculation
  const progress = calculateProjectProgress(project);
  
  // Format dates
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const dueDate = endDate ? formatDistanceToNow(endDate, { addSuffix: true }) : null;

  // Check if project is overdue
  const isOverdue = endDate && endDate < new Date() && project.status !== 'completed';

  // Get team member avatars (limit to 3)
  const teamMembers = project.members?.slice(0, 3) || [];
  const extraMembersCount = (project.members?.length || 0) - 3;

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <Card className={`group hover:shadow-lg transition-all duration-200 ${className}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  to={`/projects/${project.id}`}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                >
                  {project.name}
                </Link>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleFavorite(project);
                    }}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star 
                      size={16} 
                      className={project.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''} 
                    />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge color={getStatusColor(project.status)} size="sm">
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge color={getPriorityColor(project.priority)} size="sm" variant="outline">
                  {project.priority}
                </Badge>
                {isOverdue && (
                  <Badge color="error" size="sm">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>

            {showActions && (canManageProjects() || project.ownerId === user?.id) && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={16} />
                </Button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Eye size={14} />
                      View Details
                    </Link>
                    
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(project);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Edit size={14} />
                        Edit Project
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(project);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                        Delete Project
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            {(startDate || endDate) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={14} />
                <span>
                  {startDate && endDate 
                    ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                    : startDate 
                    ? `Started ${format(startDate, 'MMM d, yyyy')}`
                    : endDate
                    ? `Due ${format(endDate, 'MMM d, yyyy')}`
                    : null
                  }
                </span>
                {dueDate && !isOverdue && (
                  <span className="text-xs">({dueDate})</span>
                )}
              </div>
            )}

            {project.budget && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Budget: ${project.budget.toLocaleString()}</span>
              </div>
            )}

            {/* Team members */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-500" />
                <div className="flex -space-x-2">
                  {teamMembers.map((member) => (
                    <Avatar
                      key={member.id}
                      src={member.user?.avatar}
                      alt={member.user?.name || 'Team Member'}
                      size="sm"
                      className="border-2 border-white dark:border-gray-800"
                    />
                  ))}
                  {extraMembersCount > 0 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        +{extraMembersCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {project.taskCount && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span>{project.taskCount} tasks</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // List view layout
  return (
    <Card className={`group hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Project info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  to={`/projects/${project.id}`}
                  className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  {project.name}
                </Link>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleFavorite(project);
                    }}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star 
                      size={14} 
                      className={project.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''} 
                    />
                  </button>
                )}
              </div>
              
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {project.description}
                </p>
              )}
            </div>

            {/* Status and priority */}
            <div className="flex items-center gap-2">
              <Badge color={getStatusColor(project.status)} size="sm">
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge color={getPriorityColor(project.priority)} size="sm" variant="outline">
                {project.priority}
              </Badge>
              {isOverdue && (
                <Badge color="error" size="sm">
                  Overdue
                </Badge>
              )}
            </div>

            {/* Progress */}
            <div className="w-24">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Team */}
            <div className="flex -space-x-2">
              {teamMembers.map((member) => (
                <Avatar
                  key={member.id}
                  src={member.user?.avatar}
                  alt={member.user?.name || 'Team Member'}
                  size="sm"
                  className="border-2 border-white dark:border-gray-800"
                />
              ))}
              {extraMembersCount > 0 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    +{extraMembersCount}
                  </span>
                </div>
              )}
            </div>

            {/* Due date */}
            {dueDate && (
              <div className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
                <span className={isOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                  {dueDate}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (canManageProjects() || project.ownerId === user?.id) && (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropdown(!showDropdown)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={16} />
              </Button>
              
              {showDropdown && (
                <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Eye size={14} />
                    View Details
                  </Link>
                  
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(project);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit size={14} />
                      Edit Project
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(project);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                      Delete Project
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
};