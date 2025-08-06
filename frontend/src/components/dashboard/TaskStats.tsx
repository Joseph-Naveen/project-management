import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlayCircle,
  Eye,
  Target,
  Calendar,
  TrendingUp
} from 'lucide-react';
import type { Task } from '../../types';

interface TaskStatsProps {
  tasks: Task[];
  className?: string;
  onStatusClick?: (status: Task['status']) => void;
}

interface TaskMetrics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  review: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
  averageProgress: number;
  highPriorityCount: number;
  criticalCount: number;
}

const TaskStats: React.FC<TaskStatsProps> = ({
  tasks,
  className = '',
  onStatusClick
}) => {
  const metrics: TaskMetrics = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const review = tasks.filter(t => t.status === 'review').length;

    // Calculate overdue and upcoming tasks
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < today;
    }).length;

    const dueToday = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.toDateString() === today.toDateString();
    }).length;

    const dueThisWeek = tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    }).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    const averageProgress = total > 0 
      ? tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / total 
      : 0;

    const highPriorityCount = tasks.filter(t => 
      t.priority === 'high' && t.status !== 'done'
    ).length;

    const criticalCount = tasks.filter(t => 
      t.priority === 'critical' && t.status !== 'done'
    ).length;

    return {
      total,
      completed,
      inProgress,
      todo,
      review,
      overdue,
      dueToday,
      dueThisWeek,
      completionRate,
      averageProgress,
      highPriorityCount,
      criticalCount
    };
  }, [tasks]);

  const statusItems = [
    {
      status: 'done' as const,
      label: 'Completed',
      count: metrics.completed,
      percentage: metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    {
      status: 'in_progress' as const,
      label: 'In Progress',
      count: metrics.inProgress,
      percentage: metrics.total > 0 ? (metrics.inProgress / metrics.total) * 100 : 0,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: <PlayCircle className="h-4 w-4" />
    },
    {
      status: 'review' as const,
      label: 'In Review',
      count: metrics.review,
      percentage: metrics.total > 0 ? (metrics.review / metrics.total) * 100 : 0,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: <Eye className="h-4 w-4" />
    },
    {
      status: 'todo' as const,
      label: 'To Do',
      count: metrics.todo,
      percentage: metrics.total > 0 ? (metrics.todo / metrics.total) * 100 : 0,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      icon: <Clock className="h-4 w-4" />
    }
  ];

  const alertItems = [
    {
      label: 'Overdue',
      count: metrics.overdue,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      icon: <AlertTriangle className="h-4 w-4" />,
      urgent: true
    },
    {
      label: 'Due Today',
      count: metrics.dueToday,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      icon: <Calendar className="h-4 w-4" />,
      urgent: metrics.dueToday > 0
    },
    {
      label: 'Due This Week',
      count: metrics.dueThisWeek,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      label: 'Critical Priority',
      count: metrics.criticalCount,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      icon: <Target className="h-4 w-4" />,
      urgent: metrics.criticalCount > 0
    }
  ];

  return (
    <Card className={className}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Task Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overview of task completion and deadlines
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Tasks
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="px-6 pb-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Overall Completion
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {metrics.completionRate.toFixed(1)}%
            </div>
          </div>
          <Progress value={metrics.completionRate} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{metrics.completed} of {metrics.total} tasks completed</span>
            <span>Avg Progress: {metrics.averageProgress.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="px-6 pb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Status Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {statusItems.map((item) => (
            <div
              key={item.status}
              className={`
                p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm
                ${item.bgColor}
              `}
              onClick={() => onStatusClick?.(item.status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                {item.label}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.percentage.toFixed(1)}%
                </div>
                <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
                      item.status === 'done' ? 'bg-green-500' :
                      item.status === 'in_progress' ? 'bg-blue-500' :
                      item.status === 'review' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts & Deadlines */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Alerts & Deadlines
        </h4>
        <div className="space-y-2">
          {alertItems.map((item, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-2 rounded-lg
                ${item.bgColor}
                ${item.urgent ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}
              `}
            >
              <div className="flex items-center space-x-2">
                <div className={`${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
                {item.urgent && (
                  <Badge variant="destructive" className="text-xs py-0">
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.count}
                </span>
                {item.count > 0 && (
                  <div className={`w-2 h-2 rounded-full ${
                    item.urgent ? 'bg-red-500 animate-pulse' : 
                    item.count > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{metrics.highPriorityCount} high priority</span>
            <span>•</span>
            <span>{metrics.inProgress + metrics.review} active</span>
          </div>
          <span>Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </Card>
  );
};

export default TaskStats;