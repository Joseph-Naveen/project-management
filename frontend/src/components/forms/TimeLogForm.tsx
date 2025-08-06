import React, { useState } from 'react';
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
  DollarSign, 
  Save, 
  Loader2,
  Play,
  Pause,
  Timer,
  Square
} from 'lucide-react';
import type { Project, Task, User } from '../../types';

// Form validation schema
const timeLogFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  taskId: z.string().optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  duration: z.number().min(0.1, 'Duration must be at least 0.1 hours').max(24, 'Duration cannot exceed 24 hours'),
  isBillable: z.boolean(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
  date: z.string().min(1, 'Date is required')
});

type TimeLogFormData = z.infer<typeof timeLogFormSchema>;

interface TimeLogFormProps {
  currentUser?: User;
  projects?: Project[];
  tasks?: Task[];
  timeLog?: Partial<TimeLogFormData>; // For editing existing time log
  onSubmit: (data: TimeLogFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  defaultProjectId?: string;
  defaultTaskId?: string;
}

const TimeLogForm: React.FC<TimeLogFormProps> = ({
  projects = [],
  tasks = [],
  timeLog,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
  defaultProjectId,
  defaultTaskId
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const isEditing = !!timeLog;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TimeLogFormData>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: {
      projectId: timeLog?.projectId || defaultProjectId || '',
      taskId: timeLog?.taskId || defaultTaskId || '',
      description: timeLog?.description || '',
      startTime: timeLog?.startTime || new Date().toISOString().slice(0, 16),
      endTime: timeLog?.endTime || '',
      duration: timeLog?.duration || 0,
      isBillable: timeLog?.isBillable ?? true,
      hourlyRate: timeLog?.hourlyRate || 0,
      date: timeLog?.date || new Date().toISOString().slice(0, 10)
    }
  });

  const watchedProjectId = watch('projectId');
  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');

  // Filter tasks by selected project
  const availableTasks = tasks.filter(task => task.projectId === watchedProjectId);

  // Calculate duration when start and end times change
  React.useEffect(() => {
    if (watchedStartTime && watchedEndTime) {
      const start = new Date(watchedStartTime);
      const end = new Date(watchedEndTime);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      if (durationHours > 0) {
        setValue('duration', Math.round(durationHours * 10) / 10); // Round to 1 decimal
      }
    }
  }, [watchedStartTime, watchedEndTime, setValue]);

  // Timer functionality
  const startTimer = () => {
    const now = new Date();
    setValue('startTime', now.toISOString().slice(0, 16));
    setIsTimerRunning(true);
    
    const interval = setInterval(() => {
      // Update duration in real-time
      const elapsed = (new Date().getTime() - now.getTime()) / (1000 * 60 * 60);
      setValue('duration', Math.round(elapsed * 10) / 10);
    }, 60000); // Update every minute
    
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
    setValue('endTime', new Date().toISOString().slice(0, 16));
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };



  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Time Log' : 'Log Work Time'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {isEditing ? 'Update your time log entry' : 'Record the time you spent working on tasks'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project and Task Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Project & Task
          </h3>
          
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
                Task (Optional)
              </label>
              <Controller
                name="taskId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select task"
                    error={errors.taskId?.message}
                  >
                    <option value="">No specific task</option>
                    {availableTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Time Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    error={errors.date?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    error={errors.startTime?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    error={errors.endTime?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Timer Controls */}
          {!isEditing && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quick Timer
                </span>
              </div>
              
              <div className="flex items-center space-x-2 ml-auto">
                {!isTimerRunning ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startTimer}
                    disabled={isSubmitting}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={pauseTimer}
                      disabled={isSubmitting}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={stopTimer}
                      disabled={isSubmitting}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (hours) *
              </label>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0.1"
                    max="24"
                    step="0.1"
                    placeholder="0.0"
                    error={errors.duration?.message}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                )}
              />
              {watch('duration') > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDuration(watch('duration'))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hourly Rate ($)
              </label>
              <Controller
                name="hourlyRate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.hourlyRate?.message}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                )}
              />
              {(() => {
                const hourlyRate = watch('hourlyRate');
                const duration = watch('duration');
                return hourlyRate && hourlyRate > 0 && duration && duration > 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total: ${(hourlyRate * duration).toFixed(2)}
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Work Description
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What did you work on? *
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Describe the work you completed, tasks accomplished, or activities performed..."
                  rows={4}
                  error={errors.description?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Billing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Billing Settings
          </h3>
          
          <div className="flex items-center space-x-3">
            <Controller
              name="isBillable"
              control={control}
              render={({ field }) => (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Billable Time
                  </span>
                </label>
              )}
            />
            
            {watch('isBillable') === true && (
              <Badge variant="secondary" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                Billable
              </Badge>
            )}
          </div>
        </div>

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
                {isEditing ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Time Log' : 'Save Time Log'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TimeLogForm; 