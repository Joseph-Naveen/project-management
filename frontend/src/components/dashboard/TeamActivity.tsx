import React from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  FileText,
  Settings,
  Upload,
  UserPlus,
  GitCommit
} from 'lucide-react';
import type { User } from '../../types';

interface ActivityItem {
  id: string;
  type: 'comment' | 'task_completed' | 'task_created' | 'project_updated' | 'file_uploaded' | 'user_joined' | 'status_changed';
  user: User;
  title: string;
  description: string;
  timestamp: Date;
  target?: {
    type: 'task' | 'project' | 'comment';
    id: string;
    name: string;
  };
  metadata?: Record<string, string | number | boolean>;
}

interface TeamActivityProps {
  activities?: ActivityItem[];
  className?: string;
  maxItems?: number;
  onActivityClick?: (activity: ActivityItem) => void;
  onViewAll?: () => void;
}

// Mock activity data
const generateMockActivities = (): ActivityItem[] => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      role: 'manager',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      role: 'member',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      role: 'member',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'task_completed',
      user: mockUsers[0],
      title: 'Completed task',
      description: 'Finished implementing user authentication system',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      target: { type: 'task', id: '1', name: 'User Authentication System' }
    },
    {
      id: '2',
      type: 'comment',
      user: mockUsers[1],
      title: 'Added comment',
      description: 'Reviewed the design mockups and provided feedback',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      target: { type: 'task', id: '2', name: 'Design Review' }
    },
    {
      id: '3',
      type: 'file_uploaded',
      user: mockUsers[2],
      title: 'Uploaded file',
      description: 'Added project documentation and API specs',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      target: { type: 'project', id: '1', name: 'Mobile App Development' }
    },
    {
      id: '4',
      type: 'status_changed',
      user: mockUsers[0],
      title: 'Updated task status',
      description: 'Moved "Database Migration" from Todo to In Progress',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      target: { type: 'task', id: '3', name: 'Database Migration' },
      metadata: { from: 'todo', to: 'in_progress' }
    },
    {
      id: '5',
      type: 'task_created',
      user: mockUsers[1],
      title: 'Created new task',
      description: 'Added "Performance Optimization" to the backlog',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      target: { type: 'task', id: '4', name: 'Performance Optimization' }
    },
    {
      id: '6',
      type: 'user_joined',
      user: mockUsers[2],
      title: 'Joined project',
      description: 'Added as team member to E-commerce Platform',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      target: { type: 'project', id: '2', name: 'E-commerce Platform' }
    },
    {
      id: '7',
      type: 'project_updated',
      user: mockUsers[0],
      title: 'Updated project',
      description: 'Modified timeline and budget for Website Redesign',
      timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      target: { type: 'project', id: '3', name: 'Website Redesign' }
    }
  ];

  return activities;
};

const TeamActivity: React.FC<TeamActivityProps> = ({
  activities,
  className = '',
  maxItems = 10,
  onActivityClick,
  onViewAll
}) => {
  const activityData = activities || generateMockActivities();
  const displayedActivities = activityData.slice(0, maxItems);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'task_created':
        return <FileText className="h-4 w-4" />;
      case 'project_updated':
        return <Settings className="h-4 w-4" />;
      case 'file_uploaded':
        return <Upload className="h-4 w-4" />;
      case 'user_joined':
        return <UserPlus className="h-4 w-4" />;
      case 'status_changed':
        return <GitCommit className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'comment':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      case 'task_completed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'task_created':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
      case 'project_updated':
        return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      case 'file_uploaded':
        return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20';
      case 'user_joined':
        return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20';
      case 'status_changed':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  const getStatusBadge = (metadata?: Record<string, string | number | boolean>) => {
    if (!metadata || !metadata.from || !metadata.to) return null;
    
    const statusColors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800'
    };
    
    return (
      <div className="flex items-center space-x-1 mt-1">
        <Badge 
          variant="outline" 
          className={`text-xs ${statusColors[metadata.from as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
        >
          {typeof metadata.from === 'string' ? metadata.from.replace('_', ' ') : String(metadata.from || 'Unknown')}
        </Badge>
        <span className="text-xs text-gray-400">→</span>
        <Badge 
          variant="outline"
          className={`text-xs ${statusColors[metadata.to as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
        >
          {typeof metadata.to === 'string' ? metadata.to.replace('_', ' ') : String(metadata.to || 'Unknown')}
        </Badge>
      </div>
    );
  };

  return (
    <Card className={className}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Activity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Recent actions and updates from your team
            </p>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View All
            </button>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="px-6 pb-6">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <Clock className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent activity to display
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`
                  flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                  hover:bg-gray-50 dark:hover:bg-gray-800/50
                  ${index < displayedActivities.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
                `}
                onClick={() => onActivityClick?.(activity)}
              >
                {/* Activity Icon */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${getActivityColor(activity.type)}
                `}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      alt={activity.user.name}
                      src={activity.user.avatar}
                      size="sm"
                      className="h-6 w-6"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.user.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.title.toLowerCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {activity.description}
                  </p>

                  {/* Target Info */}
                  {activity.target && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.target.type}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {activity.target.name}
                      </span>
                    </div>
                  )}

                  {/* Status Change Badge */}
                  {activity.type === 'status_changed' && getStatusBadge(activity.metadata)}
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {activityData.length > maxItems && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Show {activityData.length - maxItems} more activities
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TeamActivity;