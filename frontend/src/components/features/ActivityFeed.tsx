import React, { useState, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  MessageSquare, 
  CheckCircle, 
  FileText, 
  UserPlus,
  Settings,
  Upload,
  GitCommit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'task_created' | 'task_completed' | 'comment_added' | 'user_joined' | 'project_updated' | 'deadline_approaching';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    commentId?: string;
  };
}

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'task_created':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'task_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'user_joined':
      return <UserPlus className="h-4 w-4 text-orange-500" />;
    case 'project_updated':
      return <Settings className="h-4 w-4 text-indigo-500" />;
    case 'deadline_approaching':
      return <Upload className="h-4 w-4 text-red-500" />;
    default:
      return <GitCommit className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityMessage = (activity: Activity) => {
  switch (activity.type) {
    case 'task_created':
      return `created task "${activity.metadata?.taskName}"`;
    case 'task_completed':
      return `completed task "${activity.metadata?.taskName}"`;
    case 'comment_added':
      return `commented on "${activity.metadata?.taskName}"`;
    case 'user_joined':
      return `joined the project`;
    case 'project_updated':
      return `updated project "${activity.metadata?.projectName}"`;
    case 'deadline_approaching':
      return `deadline approaching for "${activity.metadata?.taskName}"`;
    default:
      return activity.description;
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  isLoading = false,
  onRefresh,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner text="Loading activities..." />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <GitCommit className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1"
          >
            <Upload className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <div className="p-6 text-center">
            <GitCommit className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    size="sm"
                    className="h-8 w-8"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {activity.user.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getActivityMessage(activity)}
                        </span>
                      </div>
                      
                      {activity.metadata && (
                        <div className="flex items-center space-x-2 mb-2">
                          {activity.metadata.projectName && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.projectName}
                            </Badge>
                          )}
                          {activity.metadata.taskName && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.taskName}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                    </div>

                    {/* Icon and Time */}
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {/* Navigate to full activity page */}}
          >
            View All Activity
          </Button>
        </div>
      )}
    </div>
  );
};

// Real-time activity feed with polling
export const RealTimeActivityFeed: React.FC<ActivityFeedProps> = (props) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate real-time updates with polling
  useEffect(() => {
    const fetchActivities = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock activities data
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'task_completed',
          user: {
            id: '1',
            name: 'John Doe',
            avatar: 'https://via.placeholder.com/32'
          },
          title: 'Task Completed',
          description: 'Completed the authentication implementation',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          metadata: {
            taskId: 'task-1',
            taskName: 'Implement Authentication',
            projectId: 'project-1',
            projectName: 'Web App'
          }
        },
        {
          id: '2',
          type: 'comment_added',
          user: {
            id: '2',
            name: 'Jane Smith',
            avatar: 'https://via.placeholder.com/32'
          },
          title: 'Comment Added',
          description: 'Added a comment on the database design',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          metadata: {
            taskId: 'task-2',
            taskName: 'Database Design',
            projectId: 'project-1',
            projectName: 'Web App'
          }
        },
        {
          id: '3',
          type: 'user_joined',
          user: {
            id: '3',
            name: 'Mike Chen',
            avatar: 'https://via.placeholder.com/32'
          },
          title: 'User Joined',
          description: 'Joined the project team',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          metadata: {
            projectId: 'project-1',
            projectName: 'Web App'
          }
        }
      ];

      setActivities(mockActivities);
      setIsLoading(false);
    };

    fetchActivities();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ActivityFeed
      {...props}
      activities={activities}
      isLoading={isLoading}
      onRefresh={async () => {
        setIsLoading(true);
        // Simulate refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      }}
    />
  );
}; 