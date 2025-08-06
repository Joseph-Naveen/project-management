import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  Tag, 
  User as UserIcon,
  AlertTriangle,
  Loader2,
  Save
} from 'lucide-react';
import type { Task, Project } from '../../types';
import type { User } from '../../types';

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0, 'Estimated hours must be positive').optional(),
  labels: z.array(z.string()).max(10, 'Maximum 10 labels allowed'),
  dependencies: z.array(z.string()).optional()
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task;
  projects?: Project[];
  users?: User[];
  availableTasks?: Task[]; // For dependencies
  currentProjectId?: string; // Pre-select project when creating from project details
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projects = [],
  users = [],
  availableTasks = [],
  currentProjectId,
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const isEditing = !!task;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      assigneeId: task?.assigneeId || '',
      projectId: task?.projectId || currentProjectId || '',
      dueDate: task?.dueDate || '',
      estimatedHours: task?.estimatedHours || undefined,
      labels: task?.labels || [],
      dependencies: task?.dependencies?.map(d => d.id) || []
    }
  });

  const watchedLabels = watch('labels');
  const watchedDependencies = watch('dependencies');
  const [newLabel, setNewLabel] = React.useState('');

  const handleAddLabel = () => {
    if (newLabel.trim() && !watchedLabels.includes(newLabel.trim()) && watchedLabels.length < 10) {
      setValue('labels', [...watchedLabels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setValue('labels', watchedLabels.filter(label => label !== labelToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLabel();
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'review', label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  // Filter out current task from available dependencies
  const availableDependencies = availableTasks.filter(t => t.id !== task?.id);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {isEditing ? 'Update task details and settings' : 'Create a new task with all necessary information'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Basic Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter task title"
                  error={errors.title?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project *
              </label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select project"
                    error={errors.projectId?.message}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignee
              </label>
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select assignee"
                    error={errors.assigneeId?.message}
                  >
                    <option value="">Unassigned</option>
                    {users.filter(user => user.isActive).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Describe the task requirements, acceptance criteria, and any additional notes..."
                  rows={4}
                  error={errors.description?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Task Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Task Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    error={errors.status?.message}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    error={errors.priority?.message}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    error={errors.dueDate?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Hours
              </label>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.0"
                    error={errors.estimatedHours?.message}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </div>

            <div className="flex items-end">
              {watch('dueDate') && (
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due {watch('dueDate') ? new Date(watch('dueDate')!).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Labels
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Labels
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a label..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLabel}
                disabled={!newLabel.trim() || watchedLabels.length >= 10}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            
            {watchedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedLabels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(label)}
                      className="ml-1 hover:text-red-600"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {errors.labels && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.labels.message}
              </p>
            )}
          </div>
        </div>

        {/* Dependencies */}
        {availableDependencies.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Dependencies
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Dependencies
              </label>
              <Controller
                name="dependencies"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    multiple
                    placeholder="Select dependencies..."
                    error={errors.dependencies?.message}
                  >
                    {availableDependencies.map((dependency) => (
                      <option key={dependency.id} value={dependency.id}>
                        {dependency.title} ({dependency.status})
                      </option>
                    ))}
                  </Select>
                )}
              />
              
              {watchedDependencies && watchedDependencies.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected Dependencies:
                  </p>
                  <div className="space-y-1">
                    {watchedDependencies && watchedDependencies.map((depId) => {
                      const dependency = availableDependencies.find(d => d.id === depId);
                      return dependency ? (
                        <div key={depId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{dependency.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {dependency.status}
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newDeps = watchedDependencies ? watchedDependencies.filter(d => d !== depId) : [];
                              setValue('dependencies', newDeps);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="min-w-[100px]"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Task' : 'Create Task'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TaskForm; 