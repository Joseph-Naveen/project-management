import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Paperclip,
  User,
  AlertCircle,
  CheckCircle2,
  Circle,
  Hash,
  Eye,
  Filter
} from 'lucide-react';
import type { Task } from '../../types';

interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  icon: React.ReactNode;
  limit?: number;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (status: Task['status']) => void;
  className?: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo',
    color: 'bg-gray-50 border-gray-200',
    icon: <Circle className="h-4 w-4 text-gray-500" />,
    limit: 10
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    status: 'in_progress',
    color: 'bg-blue-50 border-blue-200',
    icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
    limit: 5
  },
  {
    id: 'review',
    title: 'Review',
    status: 'review',
    color: 'bg-yellow-50 border-yellow-200',
    icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    limit: 3
  },
  {
    id: 'done',
    title: 'Done',
    status: 'done',
    color: 'bg-green-50 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
  }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
  className = ''
}) => {
  const [columns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = columns.reduce((acc, column) => {
      acc[column.status] = tasks.filter(task => task.status === column.status);
      return acc;
    }, {} as Record<Task['status'], Task[]>);
    
    return grouped;
  }, [tasks, columns]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Task['status'];
    onTaskMove?.(draggableId, newStatus);
  }, [onTaskMove]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'danger' as const;
      case 'medium':
        return 'warning' as const;
      case 'low':
        return 'success' as const;
      default:
        return 'secondary' as const;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', isToday: true };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d left`, isUrgent: diffDays <= 3 };
    } else {
      return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isNormal: true };
    }
  };

  const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
    const dueDateInfo = formatDate(task.dueDate);
    
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 group ${snapshot.isDragging ? 'rotate-1 shadow-2xl scale-105 z-50' : ''}`}
          >
            <div 
              className={`
                bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-200 
                cursor-grab active:cursor-grabbing transition-all duration-150 ease-in-out
                ${getPriorityColor(task.priority)}
                ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}
                group-hover:border-blue-300
              `}
              onClick={() => onTaskClick?.(task.id)}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-2">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Hash className="h-3 w-3" />
                    <span>{task.id}</span>
                    <span>•</span>
                    <span className="capitalize">{task.priority} Priority</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle task menu
                  }}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>

              {/* Task Description */}
              {task.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Priority Badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs font-medium">
                  {task.priority}
                </Badge>
                {task.labels && task.labels.length > 0 && (
                  <>
                    {task.labels.slice(0, 2).map((label, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                    {task.labels.length > 2 && (
                      <span className="text-xs text-gray-500 font-medium">+{task.labels.length - 2}</span>
                    )}
                  </>
                )}
              </div>

              {/* Progress Bar */}
              {(() => {
                let progressPercentage = 0;
                switch (task.status) {
                  case 'done': progressPercentage = 100; break;
                  case 'review': progressPercentage = 90; break;
                  case 'in_progress': progressPercentage = 50; break;
                  case 'todo': progressPercentage = 0; break;
                  default: progressPercentage = task.progress || 0;
                }
                return progressPercentage > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Progress</span>
                      <span className="text-xs text-gray-500 font-semibold">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Task Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  {/* Due Date */}
                  {dueDateInfo && (
                    <div className={`flex items-center space-x-1 ${
                      dueDateInfo.isOverdue ? 'text-red-600' :
                      dueDateInfo.isToday ? 'text-orange-600' :
                      dueDateInfo.isUrgent ? 'text-yellow-600' :
                      'text-gray-500'
                    }`}>
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">{dueDateInfo.text}</span>
                    </div>
                  )}

                  {/* Estimated Hours */}
                  {task.estimatedHours && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">{task.estimatedHours}h</span>
                    </div>
                  )}

                  {/* Comments Count */}
                  {task.commentCount && task.commentCount > 0 && (
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="font-medium">{task.commentCount}</span>
                    </div>
                  )}

                  {/* Attachments Count */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Paperclip className="h-3 w-3" />
                      <span className="font-medium">{task.attachments.length}</span>
                    </div>
                  )}
                </div>

                {/* Assignee Avatar */}
                {task.assignee ? (
                  <Avatar
                    alt={task.assignee.name}
                    src={task.assignee.avatar}
                    size="sm"
                    className="h-6 w-6"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const ColumnHeader: React.FC<{ column: KanbanColumn; taskCount: number }> = ({ column, taskCount }) => (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {column.icon}
            <h3 className="font-semibold text-gray-900 text-base">
              {column.title}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {taskCount}
          </Badge>
          {column.limit && taskCount >= column.limit && (
            <Badge variant="danger" className="text-xs">
              Limit reached
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Board Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Project Board</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">Total tasks: {tasks.length}</span>
              <span>•</span>
              <span className="font-medium">Completed: {tasksByStatus.done?.length || 0}</span>
              <span>•</span>
              <span className="font-medium">In Progress: {tasksByStatus.in_progress?.length || 0}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>View</span>
            </Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-x-auto gap-6 px-6 py-2 min-h-[calc(100vh-200px)] bg-gray-50">
          {columns.map((column) => {
            const columnTasks = tasksByStatus[column.status] || [];
            
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="bg-white rounded-2xl shadow-md min-h-[calc(100vh-250px)] flex flex-col">
                  <ColumnHeader column={column} taskCount={columnTasks.length} />
                  
                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`
                          flex-1 px-4 pb-4 transition-all duration-200
                          ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                        `}
                      >
                        {columnTasks.map((task, index) => (
                          <TaskCard key={task.id} task={task} index={index} />
                        ))}
                        {provided.placeholder}
                        
                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <div className="text-4xl mb-2">📋</div>
                            <p className="text-sm text-center font-medium">
                              {snapshot.isDraggingOver ? 'Drop task here' : `No ${column.title.toLowerCase()} tasks`}
                            </p>
                            <p className="text-xs text-center mt-1 text-gray-500">
                              {snapshot.isDraggingOver ? 'Release to move task' : 'Drag tasks here to get started'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>

                  {/* Column Footer */}
                  <div className="px-4 pb-4 mt-auto">
                    <button 
                      className="w-full text-sm text-blue-600 hover:text-blue-700 hover:underline self-start py-2 rounded-lg hover:bg-blue-50 transition-colors duration-150"
                      onClick={() => onAddTask?.(column.status)}
                    >
                      + Add new task
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Board Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 px-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="text-xs text-gray-500">
            Drag tasks between columns to update status
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export { KanbanBoard };