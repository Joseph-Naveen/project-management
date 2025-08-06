import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Task } from '../../types';

interface ProjectTimelineProps {
  tasks: Task[];
  className?: string;
  onTaskClick?: (taskId: string) => void;
}

interface TimelineTask extends Task {
  startDate: Date;
  endDate: Date;
  progress: number;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  tasks,
  className = '',
  onTaskClick
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Convert tasks to timeline format
  const timelineTasks: TimelineTask[] = useMemo(() => {
    const currentDate = new Date();
    return tasks.map((task, index) => {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() + (index * 7));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (task.estimatedHours || 40) / 8);
      if (task.dueDate) {
        const taskDueDate = new Date(task.dueDate);
        endDate.setTime(taskDueDate.getTime());
      }
      let progress = task.progress || 0;
      if (!progress) {
        switch (task.status) {
          case 'done': progress = 100; break;
          case 'review': progress = 90; break;
          case 'in_progress': progress = 50; break;
          case 'todo': progress = 0; break;
          default: progress = 0;
        }
      }
      return {
        ...task,
        startDate,
        endDate,
        progress
      };
    });
  }, [tasks]);

  // Calculate timeline bounds
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (timelineTasks.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: now, totalDays: 1 };
    }
    const dates = timelineTasks.flatMap(task => [task.startDate, task.endDate]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return { minDate, maxDate, totalDays };
  }, [timelineTasks]);

  // Generate time scale (weekly)
  const timeScale = useMemo(() => {
    const scale = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      scale.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return scale;
  }, [minDate, maxDate]);

  const getTaskPosition = (task: TimelineTask) => {
    const startOffset = (task.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const left = (startOffset / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 2);
    return { left: `${left}%`, width: `${width}%` };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 border-green-300';
      case 'review': return 'bg-yellow-100 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 border-blue-300';
      case 'todo': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  // Handle scroll synchronization
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
  };

  // Sync header scroll with body
  useEffect(() => {
    const headerElement = document.getElementById('timeline-header');
    if (headerElement) {
      headerElement.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  if (timelineTasks.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No tasks to display</p>
          <p className="text-sm mt-1">Add some tasks to see the project timeline</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Project Timeline
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Gantt chart showing task schedules and progress
        </p>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Sticky Header */}
        <div 
          id="timeline-header"
          className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm"
          style={{ 
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            minWidth: '800px'
          }}
        >
          {/* Task Label Header */}
          <div className="p-3 bg-gray-50 border-r border-gray-200">
            <span className="text-sm font-medium text-gray-700">Tasks</span>
          </div>
          
          {/* Timeline Header */}
          <div className="overflow-hidden">
            <div 
              className="flex h-12"
              style={{ width: `${timeScale.length * 120}px` }}
            >
              {timeScale.map((date, index) => (
                <div
                  key={index}
                  className="flex-1 min-w-[120px] border-r border-gray-200 last:border-r-0"
                >
                  <div className="h-full flex flex-col justify-center items-center px-2">
                    <div className="text-xs font-medium text-gray-900">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('en-US', { day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Body */}
        <div 
          ref={timelineRef}
          className="overflow-auto max-h-[600px]"
          onScroll={handleScroll}
          style={{ 
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            minWidth: '800px'
          }}
        >
          {/* Task Labels Column */}
          <div className="border-r border-gray-200">
            {timelineTasks.map((task) => (
              <div 
                key={task.id}
                className="h-16 border-b border-gray-100 flex items-center px-3 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 
                      className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                      onClick={() => onTaskClick?.(task.id)}
                      title={task.title}
                    >
                      {task.title}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={task.priority === 'critical' || task.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Column */}
          <div className="relative">
            {timelineTasks.map((task) => {
              const position = getTaskPosition(task);
              return (
                <div 
                  key={task.id}
                  className="h-16 border-b border-gray-100 relative"
                >
                  {/* Timeline Bar */}
                  <div className="absolute inset-2 bg-gray-50 rounded-md">
                    <div
                      className={`absolute top-1 bottom-1 rounded border-2 ${getStatusColor(task.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                      style={position}
                      onClick={() => onTaskClick?.(task.id)}
                      title={`${task.title}\n${task.startDate.toLocaleDateString()} - ${task.endDate.toLocaleDateString()}\nProgress: ${task.progress}%`}
                    >
                      {/* Progress Fill */}
                      {task.progress > 0 && (
                        <div
                          className={`absolute top-0 bottom-0 left-0 rounded ${getPriorityColor(task.priority)} opacity-60`}
                          style={{ width: `${task.progress}%` }}
                        />
                      )}
                      
                      {/* Task Title (if bar is wide enough) */}
                      {parseFloat(position.width) > 20 && (
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {task.title}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Assignee Avatar */}
                    {task.assignee && (
                      <div
                        className="absolute right-2 top-1 bottom-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                        title={task.assignee.name}
                      >
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Critical/High Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>
    </Card>
  );
};