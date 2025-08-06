import React from 'react';
import { Card } from '../ui/Card';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  CalendarDays
} from 'lucide-react';
import type { TimeLog, User as UserType, Project } from '../../types';

interface TimeTrackingSummaryProps {
  timeLogs?: TimeLog[];
  users?: UserType[];
  projects?: Project[];
  className?: string;
  period?: 'today' | 'week' | 'month';
  targetHours?: number;
  onPeriodChange?: (period: 'today' | 'week' | 'month') => void;
  onViewDetails?: () => void;
}

interface TimeStats {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  targetHours: number;
  progressPercentage: number;
  averageDaily: number;
  topProjects: Array<{
    id: string;
    name: string;
    hours: number;
    percentage: number;
  }>;
  topUsers: Array<{
    id: string;
    name: string;
    avatar?: string;
    hours: number;
    billableHours: number;
  }>;
  dailyBreakdown: Array<{
    date: Date;
    hours: number;
    billableHours: number;
  }>;
  revenue: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

// Mock time tracking data generator
const generateMockTimeLogs = (): TimeLog[] => {
  const logs: TimeLog[] = [];
  const now = new Date();
  
  // Generate logs for the past 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate 2-5 random logs per day
    const logsPerDay = Math.floor(Math.random() * 4) + 2;
    
    for (let j = 0; j < logsPerDay; j++) {
      const hours = Math.random() * 4 + 1; // 1-5 hours
      const isBillable = Math.random() > 0.3; // 70% chance of being billable
      
      logs.push({
        id: `log-${i}-${j}`,
        userId: `user-${Math.floor(Math.random() * 3) + 1}`,
        projectId: `project-${Math.floor(Math.random() * 3) + 1}`,
        taskId: Math.random() > 0.5 ? `task-${Math.floor(Math.random() * 10) + 1}` : undefined,
        description: `Development work on ${['Feature A', 'Bug Fix', 'Code Review', 'Testing', 'Documentation'][Math.floor(Math.random() * 5)]}`,
        startTime: date.toISOString(),
        endTime: new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString(),
        duration: hours,
        date: date.toISOString().split('T')[0],
        user: { id: `user-${Math.floor(Math.random() * 3) + 1}`, name: `User ${Math.floor(Math.random() * 3) + 1}`, email: `user${Math.floor(Math.random() * 3) + 1}@example.com`, avatar: '', role: 'member', createdAt: '', updatedAt: '' },
        project: { id: `project-${Math.floor(Math.random() * 3) + 1}`, name: `Project ${Math.floor(Math.random() * 3) + 1}` },
        billable: isBillable,
        hourlyRate: isBillable ? 75 + Math.random() * 50 : undefined, // $75-125/hr
        approved: false,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      });
    }
  }
  
  return logs;
};

const TimeTrackingSummary: React.FC<TimeTrackingSummaryProps> = ({
  timeLogs,
  users = [],
  projects = [],
  className = '',
  period = 'week',
  targetHours = 40,
  onPeriodChange,
  onViewDetails
}) => {
  const mockTimeLogs = React.useMemo(() => timeLogs || generateMockTimeLogs(), [timeLogs]);

  const timeStats: TimeStats = React.useMemo(() => {
    const now = new Date();
    let startDate: Date;

    // Determine date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Filter logs for the period
    const periodLogs = mockTimeLogs.filter(log => {
      const logDate = new Date(log.startTime || new Date());
      return logDate >= startDate && logDate <= now;
    });

    // Calculate basic stats
    const totalHours = periodLogs.reduce((sum, log) => sum + log.duration, 0);
    const billableHours = periodLogs.filter(log => log.billable).reduce((sum, log) => sum + log.duration, 0);
    const nonBillableHours = totalHours - billableHours;
    const progressPercentage = (totalHours / targetHours) * 100;
    
    // Calculate daily average
    const daysInPeriod = period === 'today' ? 1 : 
                        period === 'week' ? 7 : 
                        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const averageDaily = totalHours / daysInPeriod;

    // Calculate revenue
    const revenue = periodLogs
      .filter(log => log.billable && log.hourlyRate)
      .reduce((sum, log) => sum + (log.duration * (log.hourlyRate || 0)), 0);

    // Group by projects
    const projectStats = periodLogs.reduce((acc, log) => {
      const projectId = log.projectId;
      if (!acc[projectId]) {
        acc[projectId] = { hours: 0, name: projects.find(p => p.id === projectId)?.name || `Project ${projectId}` };
      }
      acc[projectId].hours += log.duration;
      return acc;
    }, {} as Record<string, { hours: number; name: string }>);

    const topProjects = Object.entries(projectStats)
      .map(([id, data]) => ({
        id,
        name: data.name,
        hours: data.hours,
        percentage: (data.hours / totalHours) * 100
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Group by users
    const userStats = periodLogs.reduce((acc, log) => {
      const userId = log.userId;
      if (!acc[userId]) {
        const user = users.find(u => u.id === userId);
        acc[userId] = {
          hours: 0,
          billableHours: 0,
          name: user?.name || `User ${userId}`,
          avatar: user?.avatar
        };
      }
      acc[userId].hours += log.duration;
      if (log.billable) {
        acc[userId].billableHours += log.duration;
      }
      return acc;
    }, {} as Record<string, { hours: number; billableHours: number; name: string; avatar?: string }>);

    const topUsers = Object.entries(userStats)
      .map(([id, data]) => ({
        id,
        name: data.name,
        avatar: data.avatar,
        hours: data.hours,
        billableHours: data.billableHours
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Calculate daily breakdown
    const dailyStats = new Map<string, { hours: number; billableHours: number }>();
    periodLogs.forEach(log => {
      const day = new Date(log.startTime || new Date()).toDateString();
      if (!dailyStats.has(day)) {
        dailyStats.set(day, { hours: 0, billableHours: 0 });
      }
      const dayStats = dailyStats.get(day)!;
      dayStats.hours += log.duration;
      if (log.billable) {
        dayStats.billableHours += log.duration;
      }
    });

    const dailyBreakdown = Array.from(dailyStats.entries())
      .map(([dateStr, stats]) => ({
        date: new Date(dateStr),
        hours: stats.hours,
        billableHours: stats.billableHours
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate trend (mock for demo)
    const trend = {
      direction: 'up' as const,
      percentage: Math.random() * 20 + 5 // 5-25% increase
    };

    return {
      totalHours,
      billableHours,
      nonBillableHours,
      targetHours,
      progressPercentage,
      averageDaily,
      topProjects,
      topUsers,
      dailyBreakdown,
      revenue,
      trend
    };
  }, [mockTimeLogs, period, targetHours, users, projects]);

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
    }
  };

  return (
    <Card className={className}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Time Tracking Summary
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Hours logged and productivity insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange?.(p)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-md transition-colors
                  ${period === p 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Hours</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatHours(timeStats.totalHours)}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {timeStats.trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${
                timeStats.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {timeStats.trend.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Billable</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatHours(timeStats.billableHours)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {((timeStats.billableHours / timeStats.totalHours) * 100 || 0).toFixed(1)}% of total
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Daily Avg</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatHours(timeStats.averageDaily)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              per {period === 'today' ? 'day' : 'day this ' + period}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Revenue</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(timeStats.revenue)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              from billable hours
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Target */}
      <div className="px-6 pb-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Progress to Target ({getPeriodLabel()})
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatHours(timeStats.totalHours)} / {formatHours(timeStats.targetHours)}
            </span>
          </div>
          <div 
            className="h-2 mb-2"
            style={{
              background: `linear-gradient(to right, #4F46E5 ${timeStats.progressPercentage}%, #E0E7FF ${timeStats.progressPercentage}%)`
            }}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {timeStats.progressPercentage >= 100 ? (
              <span className="text-green-600 dark:text-green-400">✓ Target achieved!</span>
            ) : (
              <span>{formatHours(timeStats.targetHours - timeStats.totalHours)} remaining to reach target</span>
            )}
          </div>
        </div>
      </div>

      {/* Top Projects & Users */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Projects */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Top Projects
            </h4>
            <div className="space-y-2">
              {timeStats.topProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${Math.min(project.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatHours(project.hours)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Top Contributors
            </h4>
            <div className="space-y-2">
              {timeStats.topUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatHours(user.billableHours)} billable
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                    {formatHours(user.hours)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{timeStats.topProjects.length} projects active</span>
            <span>•</span>
            <span>{timeStats.topUsers.length} contributors</span>
            <span>•</span>
            <span>{((timeStats.billableHours / timeStats.totalHours) * 100 || 0).toFixed(0)}% billable</span>
          </div>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TimeTrackingSummary;