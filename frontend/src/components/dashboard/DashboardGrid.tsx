import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Layout, 
  Settings, 
  Maximize2, 
  Minimize2,
  MoreVertical,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import ProjectStats from './ProjectStats';
import TaskStats from './TaskStats';
import TeamActivity from './TeamActivity';
import DeadlineAlerts from './DeadlineAlerts';
import TimeTrackingSummary from './TimeTrackingSummary';
import type { Project, Task, User, TimeLog } from '../../types';

interface WidgetConfig {
  id: string;
  component: React.ComponentType<any>;
  title: string;
  description: string;
  defaultProps?: Record<string, any>;
  gridSize: {
    cols: 1 | 2 | 3 | 4;
    rows: 1 | 2 | 3;
  };
  isVisible: boolean;
  isExpanded?: boolean;
  position: {
    x: number;
    y: number;
  };
}

interface DashboardGridProps {
  projects?: Project[];
  tasks?: Task[];
  users?: User[];
  timeLogs?: TimeLog[];
  className?: string;
  editable?: boolean;
  onWidgetClick?: (widgetId: string) => void;
  onProjectStatusClick?: (status: Project['status']) => void;
  onTaskStatusClick?: (status: Task['status']) => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  projects = [],
  tasks = [],
  users = [],
  timeLogs = [],
  className = '',
  editable = false,
  onWidgetClick,
  onProjectStatusClick,
  onTaskStatusClick
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    {
      id: 'project-stats',
      component: ProjectStats,
      title: 'Project Overview',
      description: 'Current status of all projects',
      gridSize: { cols: 2, rows: 2 },
      isVisible: true,
      position: { x: 0, y: 0 },
      defaultProps: {
        projects,
        onStatusClick: onProjectStatusClick
      }
    },
    {
      id: 'task-stats',
      component: TaskStats,
      title: 'Task Progress',
      description: 'Overview of task completion and deadlines',
      gridSize: { cols: 2, rows: 2 },
      isVisible: true,
      position: { x: 2, y: 0 },
      defaultProps: {
        tasks,
        onStatusClick: onTaskStatusClick
      }
    },
    {
      id: 'deadline-alerts',
      component: DeadlineAlerts,
      title: 'Deadline Alerts',
      description: 'Upcoming deadlines and overdue items',
      gridSize: { cols: 2, rows: 2 },
      isVisible: true,
      position: { x: 0, y: 2 },
      defaultProps: {
        tasks,
        projects,
        onItemClick: (item: any) => onWidgetClick?.(`${item.type}-${item.id}`)
      }
    },
    {
      id: 'team-activity',
      component: TeamActivity,
      title: 'Team Activity',
      description: 'Recent actions and updates from your team',
      gridSize: { cols: 2, rows: 2 },
      isVisible: true,
      position: { x: 2, y: 2 },
      defaultProps: {
        onActivityClick: (activity: any) => onWidgetClick?.(activity.id),
        onViewAll: () => onWidgetClick?.('activity-feed')
      }
    },
    {
      id: 'time-tracking',
      component: TimeTrackingSummary,
      title: 'Time Tracking Summary',
      description: 'Hours logged and productivity insights',
      gridSize: { cols: 4, rows: 2 },
      isVisible: true,
      position: { x: 0, y: 4 },
      defaultProps: {
        timeLogs,
        users,
        projects,
        onViewDetails: () => onWidgetClick?.('timesheet')
      }
    }
  ]);

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<'default' | 'compact' | 'wide'>('default');

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, isVisible: !widget.isVisible }
        : widget
    ));
  };

  const toggleWidgetExpansion = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { 
            ...widget, 
            isExpanded: !widget.isExpanded,
            gridSize: widget.isExpanded 
              ? { cols: Math.min(widget.gridSize.cols, 2) as 1 | 2, rows: Math.min(widget.gridSize.rows, 2) as 1 | 2 }
              : { cols: Math.min(widget.gridSize.cols * 2, 4) as 1 | 2 | 3 | 4, rows: Math.min(widget.gridSize.rows * 2, 3) as 1 | 2 | 3 }
          }
        : widget
    ));
  };

  const applyLayout = (layout: 'default' | 'compact' | 'wide') => {
    setSelectedLayout(layout);
    
    const layoutConfigs = {
      default: [
        { id: 'project-stats', cols: 2, rows: 2, x: 0, y: 0 },
        { id: 'task-stats', cols: 2, rows: 2, x: 2, y: 0 },
        { id: 'deadline-alerts', cols: 2, rows: 2, x: 0, y: 2 },
        { id: 'team-activity', cols: 2, rows: 2, x: 2, y: 2 },
        { id: 'time-tracking', cols: 4, rows: 2, x: 0, y: 4 }
      ],
      compact: [
        { id: 'project-stats', cols: 1, rows: 1, x: 0, y: 0 },
        { id: 'task-stats', cols: 1, rows: 1, x: 1, y: 0 },
        { id: 'deadline-alerts', cols: 1, rows: 1, x: 2, y: 0 },
        { id: 'team-activity', cols: 1, rows: 1, x: 3, y: 0 },
        { id: 'time-tracking', cols: 4, rows: 1, x: 0, y: 1 }
      ],
      wide: [
        { id: 'project-stats', cols: 3, rows: 2, x: 0, y: 0 },
        { id: 'task-stats', cols: 1, rows: 2, x: 3, y: 0 },
        { id: 'deadline-alerts', cols: 2, rows: 2, x: 0, y: 2 },
        { id: 'team-activity', cols: 2, rows: 2, x: 2, y: 2 },
        { id: 'time-tracking', cols: 4, rows: 2, x: 0, y: 4 }
      ]
    };

    const config = layoutConfigs[layout];
    setWidgets(prev => prev.map(widget => {
      const layoutItem = config.find(item => item.id === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          gridSize: { cols: layoutItem.cols as 1 | 2 | 3 | 4, rows: layoutItem.rows as 1 | 2 | 3 },
          position: { x: layoutItem.x, y: layoutItem.y }
        };
      }
      return widget;
    }));
  };

  const visibleWidgets = widgets.filter(w => w.isVisible);
  const hiddenWidgets = widgets.filter(w => !w.isVisible);

  const getGridClasses = (widget: WidgetConfig) => {
    const colSpanClasses = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4'
    };
    
    const rowSpanClasses = {
      1: 'row-span-1',
      2: 'row-span-2',
      3: 'row-span-3'
    };

    return `${colSpanClasses[widget.gridSize.cols]} ${rowSpanClasses[widget.gridSize.rows]}`;
  };

  const WidgetWrapper: React.FC<{ widget: WidgetConfig; children: React.ReactNode }> = ({ 
    widget, 
    children 
  }) => (
    <div className={`relative group ${getGridClasses(widget)}`}>
      {editable && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleWidgetExpansion(widget.id)}
              title={widget.isExpanded ? 'Minimize' : 'Maximize'}
            >
              {widget.isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleWidgetVisibility(widget.id)}
              title="Hide widget"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Widget settings"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of your projects, tasks, and team activity
          </p>
        </div>
        
        {editable && (
          <div className="flex items-center space-x-2">
            {/* Layout Selector */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
              {(['default', 'compact', 'wide'] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => applyLayout(layout)}
                  className={`
                    px-2 py-1 text-xs font-medium rounded transition-colors
                    ${selectedLayout === layout
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </button>
              ))}
            </div>

            <Button
                              variant={isCustomizing ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsCustomizing(!isCustomizing)}
            >
              <Layout className="h-4 w-4 mr-2" />
              {isCustomizing ? 'Done' : 'Customize'}
            </Button>
          </div>
        )}
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dashboard Customization
            </h3>
            <Badge variant="secondary" className="text-xs">
              {visibleWidgets.length} of {widgets.length} widgets visible
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`
                  p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${widget.isVisible 
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }
                `}
                onClick={() => toggleWidgetVisibility(widget.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {widget.title}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {widget.isVisible ? (
                      <Eye className="h-4 w-4 text-blue-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {widget.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Size: {widget.gridSize.cols} × {widget.gridSize.rows}
                </div>
              </div>
            ))}
          </div>

          {hiddenWidgets.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hidden Widgets ({hiddenWidgets.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenWidgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{widget.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-4 gap-6 auto-rows-fr">
        {visibleWidgets.map((widget) => {
          const Component = widget.component;
          return (
            <WidgetWrapper key={widget.id} widget={widget}>
              <Component
                className="h-full"
                {...widget.defaultProps}
                onClick={() => onWidgetClick?.(widget.id)}
              />
            </WidgetWrapper>
          );
        })}
      </div>

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Layout className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No widgets visible
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enable some widgets to see your dashboard data
          </p>
          <Button
            onClick={() => setIsCustomizing(true)}
            className="mx-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize Dashboard
          </Button>
        </Card>
      )}

      {/* Dashboard Footer */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{projects.length} projects</span>
            <span>•</span>
            <span>{tasks.length} tasks</span>
            <span>•</span>
            <span>{users.length} team members</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <button 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;