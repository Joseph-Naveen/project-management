import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
  Plus,
  AlertCircle
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { teamService } from '../../services/teamService';
import type { Project, User, Team } from '../../types';

// Enhanced form validation schema with team requirements
const enhancedProjectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  startDate: z.string().optional().or(z.undefined()),
  endDate: z.string().optional().or(z.undefined()),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  ownerId: z.string().min(1, 'Project owner is required'),
  teamId: z.string().min(1, 'Team selection is required'),
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

type EnhancedProjectFormData = z.infer<typeof enhancedProjectFormSchema>;

interface EnhancedProjectFormProps {
  project?: Project;
  users?: User[];
  onSubmit: (data: EnhancedProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const EnhancedProjectForm: React.FC<EnhancedProjectFormProps> = ({
  project,
  users = [],
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const { user } = useAuthContext();
  const isEditing = !!project;

  // Fetch teams for team selection
  const { data: teamsResponse, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  });

  const teams = teamsResponse?.data || [];

  // Filter users by role - only managers can be project owners
  const managerUsers = users.filter(u => u.role === 'manager' || u.role === 'admin');
  
  // Check if current user can be project owner
  const canBeProjectOwner = user && (user.role === 'manager' || user.role === 'admin');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EnhancedProjectFormData>({
    resolver: zodResolver(enhancedProjectFormSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'planning',
      priority: project?.priority || 'medium',
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
      budget: project?.budget || undefined,
      tags: project?.tags || [],
      ownerId: project?.ownerId || (canBeProjectOwner ? user?.id : ''),
      teamId: project?.teamId || '',
      members: project?.members?.map(m => m.id) || []
    }
  });

  const watchedTags = watch('tags');
  const watchedTeamId = watch('teamId');
  const [newTag, setNewTag] = React.useState('');

  // Get selected team's manager for validation
  const selectedTeam = teams.find(team => team.id === watchedTeamId);
  
  // Handle form submission with enhanced validation
  const handleFormSubmit = async (data: EnhancedProjectFormData) => {
    try {
      // Additional validation: ensure owner is a manager or admin
      const selectedOwner = users.find(u => u.id === data.ownerId);
      if (selectedOwner && !['manager', 'admin'].includes(selectedOwner.role)) {
        throw new Error('Project owner must be a manager or administrator');
      }

      // Process dates - convert empty strings to undefined
      const processedData = {
        ...data,
        startDate: data.startDate && data.startDate.trim() !== '' ? data.startDate : undefined,
        endDate: data.endDate && data.endDate.trim() !== '' ? data.endDate : undefined,
      };
      
      console.log('📝 Submitting enhanced project data:', processedData);
      await onSubmit(processedData);
    } catch (error) {
      console.error('❌ Enhanced form submission error:', error);
      throw error;
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

  // Show access denied for non-managers trying to create projects
  if (!isEditing && !canBeProjectOwner) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Card className="card-elevated">
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500 mb-4">
              Only managers and administrators can create new projects.
            </p>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="card-elevated">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="heading-xl text-gray-900 dark:text-white">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-muted text-lg mt-2">
              {isEditing ? 'Update project details and settings' : 'Set up a new project with team assignment'}
            </p>
            {!canBeProjectOwner && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    You can edit this project, but only managers and administrators can be project owners.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Name */}
                <div className="md:col-span-2">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Project Name"
                        placeholder="Enter project name"
                        error={errors.name?.message}
                        required
                      />
                    )}
                  />
                </div>

                {/* Team Selection - Required */}
                <div>
                  <Controller
                    name="teamId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Assigned Team"
                        placeholder={teamsLoading ? "Loading teams..." : "Select a team"}
                        error={errors.teamId?.message}
                        required
                        disabled={teamsLoading}
                      >
                        {teams.map((team: Team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} {team.manager && `(Manager: ${team.manager.name})`}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  {selectedTeam && (
                    <p className="mt-1 text-sm text-gray-600">
                      Team Manager: {selectedTeam.manager?.name || 'No manager assigned'}
                    </p>
                  )}
                </div>

                {/* Project Owner - Restricted to Managers */}
                <div>
                  <Controller
                    name="ownerId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Project Owner"
                        placeholder="Select project owner"
                        error={errors.ownerId?.message}
                        required
                      >
                        {managerUsers.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name} ({owner.role})
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Only managers and administrators can be project owners
                  </p>
                </div>
              </div>

              {/* Description */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="Description"
                    placeholder="Describe the project goals, requirements, and scope"
                    rows={4}
                    error={errors.description?.message}
                  />
                )}
              />
            </div>

            {/* Project Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Status"
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

              {/* Priority */}
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Priority"
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

            {/* Timeline and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Start Date */}
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    label="Start Date"
                    error={errors.startDate?.message}
                  />
                )}
              />

              {/* End Date */}
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    label="End Date"
                    error={errors.endDate?.message}
                  />
                )}
              />

              {/* Budget */}
              <Controller
                name="budget"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                    label="Budget"
                    placeholder="0"
                    error={errors.budget?.message}
                    min="0"
                    step="0.01"
                  />
                )}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags <span className="text-gray-500">({watchedTags.length}/10)</span>
              </label>
              
              {/* Tag Input */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={20}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || watchedTags.length >= 10 || watchedTags.includes(newTag.trim())}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Tags Display */}
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="min-w-[120px]"
              >
                {(isSubmitting || isLoading) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export { EnhancedProjectForm };
export type { EnhancedProjectFormData };
