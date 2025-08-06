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
  Save, 
  Loader2,
  X,
  Plus
} from 'lucide-react';
import type { Project, User } from '../../types';

// Form validation schema
const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  startDate: z.string().optional().or(z.undefined()),
  endDate: z.string().optional().or(z.undefined()),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  ownerId: z.string().min(1, 'Project owner is required'),
  members: z.array(z.string()).optional()
}).refine((data) => {
  // Custom validation to ensure start date is before end date when both are provided
  if (data.startDate && data.endDate && data.startDate.trim() !== '' && data.endDate.trim() !== '') {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["endDate"]
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project;
  users?: User[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  users = [],
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const isEditing = !!project;

  // Filter users to show only managers and admins for project ownership
  const projectManagers = users.filter(user => 
    user.role === 'admin' || user.role === 'manager'
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'planning',
      priority: project?.priority || 'medium',
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
      budget: project?.budget || undefined,
      tags: project?.tags || [],
      ownerId: project?.ownerId || '',
      members: project?.members?.map(m => m.id) || []
    }
  });

  // Reset form when project changes (for editing)
  React.useEffect(() => {
    if (project) {
      reset({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        budget: project.budget || undefined,
        tags: project.tags || [],
        ownerId: project.ownerId || '',
        members: project.members?.map(m => m.id) || []
      });
    }
  }, [project, reset]);

  const watchedTags = watch('tags');
  const [newTag, setNewTag] = React.useState('');

  // Handle form submission with date processing
  const handleFormSubmit = async (data: ProjectFormData) => {
    try {
      // Process dates - convert empty strings to undefined to avoid "Invalid date" errors
      const processedData = {
        ...data,
        startDate: data.startDate && data.startDate.trim() !== '' ? data.startDate : undefined,
        endDate: data.endDate && data.endDate.trim() !== '' ? data.endDate : undefined,
      };
      
      console.log('📝 Submitting project data:', processedData);
      await onSubmit(processedData);
    } catch (error) {
      console.error('❌ Form submission error:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim()) && watchedTags.length < 10) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="card-elevated">
        <div className="p-8">
  

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Project Name *
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter project name"
                    error={errors.name?.message}
                    className="form-input"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Project Manager *
              </label>
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select project manager"
                    error={errors.ownerId?.message}
                    className="form-input"
                  >
                    {projectManagers.map((user) => (
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
                  placeholder="Describe the project goals, scope, and key deliverables..."
                  rows={4}
                  error={errors.description?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Project Settings */}
        <div className="space-y-6">
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="heading-md text-gray-900 dark:text-white">
              Project Settings
            </h3>
            <p className="text-muted mt-1">Configure status, priority, and timeline</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    error={errors.status?.message}
                    className="form-input"
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    error={errors.priority?.message}
                    className="form-input"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Start Date
              </label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    error={errors.startDate?.message}
                    className="form-input"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                End Date
              </label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    error={errors.endDate?.message}
                    className="form-input"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Budget ($)
              </label>
              <Controller
                name="budget"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.budget?.message}
                    className="form-input"
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-6">
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="heading-md text-gray-900 dark:text-white">
              Project Tags
            </h3>
            <p className="text-muted mt-1">Add relevant tags to categorize your project</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Add Tags
            </label>
            <div className="flex items-center space-x-3 mb-4">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a tag name..."
                className="flex-1 form-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || watchedTags.length >= 10}
                className="px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {errors.tags && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.tags.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="btn-primary min-w-[140px] px-6 py-2"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Project' : 'Create Project'}
              </>
            )}
          </Button>
        </div>
      </form>
        </div>
      </Card>
    </div>
  );
};

export default ProjectForm; 