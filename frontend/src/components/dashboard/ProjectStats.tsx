import React from 'react';
import { Card } from '../ui/Card';
import { 
  TrendingUp, 
  TrendingDown,
  FolderOpen,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import type { Project } from '../../types';

interface ProjectStatsProps {
  projects: Project[];
  className?: string;
  onStatusClick?: (status: Project['status']) => void;
}

interface StatusStats {
  status: Project['status'];
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({
  projects,
  className = '',
  onStatusClick
}) => {
  const totalProjects = projects.length;

  // Calculate project statistics by status
  const statusStats: StatusStats[] = React.useMemo(() => {
    const statusCounts = projects.reduce((acc: Record<string, number>, project: Project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<Project['status'], number>);

    const statuses: Array<{
      status: Project['status'];
      label: string;
      color: string;
      bgColor: string;
      icon: React.ReactNode;
    }> = [
      {
        status: 'planning',
        label: 'Planning',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        icon: <FolderOpen className="h-5 w-5" />
      },
      {
        status: 'active',
        label: 'Active',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        icon: <Play className="h-5 w-5" />
      },
      {
        status: 'on_hold',
        label: 'On Hold',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: <Pause className="h-5 w-5" />
      },
      {
        status: 'completed',
        label: 'Completed',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: <CheckCircle className="h-5 w-5" />
      },
      {
        status: 'cancelled',
        label: 'Cancelled',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: <XCircle className="h-5 w-5" />
      }
    ];

    return statuses.map(status => {
      const count = statusCounts[status.status] || 0;
      const percentage = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
      
      // Mock trend data for demo
      const mockTrends = {
        planning: { trend: 'up' as const, value: 12 },
        active: { trend: 'up' as const, value: 8 },
        on_hold: { trend: 'stable' as const, value: 0 },
        completed: { trend: 'up' as const, value: 15 },
        cancelled: { trend: 'down' as const, value: -5 }
      };

      return {
        ...status,
        count,
        percentage,
        trend: mockTrends[status.status]?.trend,
        trendValue: mockTrends[status.status]?.value
      };
    });
  }, [projects, totalProjects]);

  // Calculate health metrics
  const healthMetrics = React.useMemo(() => {
    const activeProjects = statusStats.find(s => s.status === 'active')?.count || 0;
    const completedProjects = statusStats.find(s => s.status === 'completed')?.count || 0;
    const onHoldProjects = statusStats.find(s => s.status === 'on_hold')?.count || 0;
    
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const activeRate = totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0;
    
    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    let healthColor = 'text-green-600 dark:text-green-400';
    
    if (onHoldProjects > activeProjects) {
      healthStatus = 'critical';
      healthColor = 'text-red-600 dark:text-red-400';
    } else if (activeRate < 30) {
      healthStatus = 'warning';
      healthColor = 'text-yellow-600 dark:text-yellow-400';
    } else if (completionRate < 20) {
      healthStatus = 'good';
      healthColor = 'text-blue-600 dark:text-blue-400';
    }

    return {
      completionRate,
      activeRate,
      healthStatus,
      healthColor
    };
  }, [statusStats, totalProjects]);

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <BarChart3 className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <Card className={`${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Overview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Current status of all projects
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalProjects}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Projects
            </div>
          </div>
        </div>
      </div>

      {/* Project Health */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${
              healthMetrics.healthStatus === 'excellent' ? 'bg-green-500' :
              healthMetrics.healthStatus === 'good' ? 'bg-blue-500' :
              healthMetrics.healthStatus === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Portfolio Health: {healthMetrics.healthStatus.charAt(0).toUpperCase() + healthMetrics.healthStatus.slice(1)}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {healthMetrics.completionRate.toFixed(1)}% completion rate
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="px-6 pb-6">
        <div className="space-y-3">
          {statusStats.map((stat) => (
            <div
              key={stat.status}
              className={`
                flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
                hover:shadow-sm ${stat.bgColor}
              `}
              onClick={() => onStatusClick?.(stat.status)}
            >
              <div className="flex items-center space-x-3">
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stat.label}
                    </span>
                    {stat.trend && stat.trendValue !== 0 && (
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(stat.trend)}
                        <span className={`text-xs font-medium ${
                          stat.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                          stat.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {stat.trendValue && stat.trendValue > 0 ? '+' : ''}{stat.trendValue || 0}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.count}
                  </div>
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-300 dark:text-gray-600"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${stat.percentage}, 100`}
                      className={stat.color}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {stat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ProjectStats;