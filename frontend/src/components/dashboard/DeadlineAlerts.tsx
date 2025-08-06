import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Flag,
  ExternalLink,
  Bell,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import type { Task, Project } from '../../types';

interface DeadlineItem {
  id: string;
  type: 'task' | 'project';
  title: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  progress?: number;
  isOverdue: boolean;
  daysDifference: number;
}

interface DeadlineAlertsProps {
  tasks?: Task[];
  projects?: Project[];
  className?: string;
  maxItems?: number;
  onItemClick?: (item: DeadlineItem) => void;
  onMarkComplete?: (item: DeadlineItem) => void;
}

const DeadlineAlerts: React.FC<DeadlineAlertsProps> = ({
  tasks = [],
  projects = [],
  className = '',
  maxItems = 8,
  onItemClick,
  onMarkComplete
}) => {
  const deadlineItems: DeadlineItem[] = React.useMemo(() => {
    const now = new Date();
    const items: DeadlineItem[] = [];

    // Process tasks
    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'done') return;
      
      const dueDate = new Date(task.dueDate);
      const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only include items due within 14 days or overdue
      if (daysDifference <= 14) {
        items.push({
          id: task.id,
          type: 'task',
          title: task.title,
          dueDate,
          priority: task.priority,
          status: task.status,
          assignee: task.assignee ? {
            id: task.assignee.id,
            name: task.assignee.name,
            avatar: task.assignee.avatar
          } : undefined,
          project: task.project ? {
            id: task.project.id,
            name: task.project.name
          } : undefined,
          progress: task.progress,
          isOverdue: daysDifference < 0,
          daysDifference
        });
      }
    });

    // Process projects
    projects.forEach(project => {
      if (!project.endDate || project.status === 'completed' || project.status === 'cancelled') return;
      
      const dueDate = new Date(project.endDate);
      const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only include items due within 30 days or overdue
      if (daysDifference <= 30) {
        items.push({
          id: project.id,
          type: 'project',
          title: project.name,
          dueDate,
          priority: project.priority,
          status: project.status,
          progress: project.progress,
          isOverdue: daysDifference < 0,
          daysDifference
        });
      }
    });

    // Sort by urgency: overdue first, then by days until due, then by priority
    return items.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.daysDifference !== b.daysDifference) return a.daysDifference - b.daysDifference;
      
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, maxItems);
  }, [tasks, projects, maxItems]);

  const getUrgencyInfo = (item: DeadlineItem) => {
    if (item.isOverdue) {
      const daysOverdue = Math.abs(item.daysDifference);
      return {
        label: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        urgency: 'critical' as const
      };
    } else if (item.daysDifference === 0) {
      return {
        label: 'Due today',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        urgency: 'high' as const
      };
    } else if (item.daysDifference === 1) {
      return {
        label: 'Due tomorrow',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        urgency: 'medium' as const
      };
    } else if (item.daysDifference <= 3) {
      return {
        label: `Due in ${item.daysDifference} days`,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        urgency: 'medium' as const
      };
    } else if (item.daysDifference <= 7) {
      return {
        label: `Due in ${item.daysDifference} days`,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        urgency: 'low' as const
      };
    } else {
      return {
        label: `Due ${item.dueDate.toLocaleDateString()}`,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        urgency: 'low' as const
      };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Flag className="h-3 w-3 text-red-500" />;
      case 'high':
        return <Flag className="h-3 w-3 text-orange-500" />;
      case 'medium':
        return <Flag className="h-3 w-3 text-yellow-500" />;
      case 'low':
        return <Flag className="h-3 w-3 text-green-500" />;
      default:
        return <Flag className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: 'task' | 'project') => {
    return type === 'task' ? 
      <CheckCircle2 className="h-4 w-4" /> : 
      <Calendar className="h-4 w-4" />;
  };

  // Group items by urgency for better organization
  const urgencyGroups = React.useMemo(() => {
    const groups = {
      critical: [] as DeadlineItem[],
      high: [] as DeadlineItem[],
      medium: [] as DeadlineItem[],
      low: [] as DeadlineItem[]
    };

    deadlineItems.forEach(item => {
      const urgency = getUrgencyInfo(item).urgency;
      groups[urgency].push(item);
    });

    return groups;
  }, [deadlineItems]);

  const totalCritical = urgencyGroups.critical.length;
  const totalHigh = urgencyGroups.high.length;

  return (
    <Card className={className}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Deadline Alerts
              </h3>
            </div>
            {(totalCritical > 0 || totalHigh > 0) && (
              <div className="flex items-center space-x-1">
                {totalCritical > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {totalCritical} overdue
                  </Badge>
                )}
                {totalHigh > 0 && (
                  <Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
                    {totalHigh} urgent
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {deadlineItems.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Upcoming
            </div>
          </div>
        </div>
      </div>

      {/* Alert Items */}
      <div className="px-6 pb-6">
        {deadlineItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-500 mb-2">
              <CheckCircle2 className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No upcoming deadlines to worry about!
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Great job staying on top of your schedule
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlineItems.map((item) => {
              const urgencyInfo = getUrgencyInfo(item);
              
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all duration-200
                    hover:shadow-md ${urgencyInfo.bgColor}
                    ${urgencyInfo.urgency === 'critical' ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}
                  `}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={urgencyInfo.color}>
                          {getTypeIcon(item.type)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        {getPriorityIcon(item.priority)}
                        <span className={`text-xs font-medium ${urgencyInfo.color}`}>
                          {urgencyInfo.label}
                        </span>
                        {urgencyInfo.urgency === 'critical' && (
                          <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {item.title}
                      </h4>

                      {/* Meta Information */}
                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.dueDate.toLocaleDateString()}</span>
                        </div>
                        
                        {item.progress !== undefined && (
                          <div className="flex items-center space-x-1">
                            <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                              <div
                                className="h-1 bg-blue-500 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span>{item.progress}%</span>
                          </div>
                        )}

                        {item.project && (
                          <div className="flex items-center space-x-1">
                            <span>in</span>
                            <Badge variant="outline" className="text-xs">
                              {item.project.name}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Assignee */}
                      {item.assignee && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Avatar
                            alt={item.assignee.name}
                            src={item.assignee.avatar}
                            size="sm"
                            className="h-5 w-5"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.assignee.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-3">
                      {item.type === 'task' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkComplete?.(item);
                          }}
                          title="Mark as complete"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick?.(item);
                        }}
                        title="View details"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {deadlineItems.length > 0 && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>{totalCritical + totalHigh} need attention</span>
              <span>•</span>
              <span>{deadlineItems.filter(i => i.type === 'task').length} tasks</span>
              <span>•</span>
              <span>{deadlineItems.filter(i => i.type === 'project').length} projects</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700">
              <span>View calendar</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeadlineAlerts;