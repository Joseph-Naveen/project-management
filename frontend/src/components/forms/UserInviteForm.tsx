import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { 
  UserPlus, 
  Mail, 
  Users, 
  Send, 
  Loader2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import type { Project, User } from '../../types';

// Form validation schema
const userInviteFormSchema = z.object({
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']),
  projectId: z.string().min(1, 'Project is required'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  sendWelcomeEmail: z.boolean()
});

type UserInviteFormData = z.infer<typeof userInviteFormSchema>;

interface UserInviteFormProps {
  project?: Project;
  projects?: Project[];
  existingUsers?: User[];
  onSubmit: (data: UserInviteFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const UserInviteForm: React.FC<UserInviteFormProps> = ({
  project,
  projects = [],
  existingUsers = [],
  onSubmit,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<UserInviteFormData>({
    resolver: zodResolver(userInviteFormSchema),
    defaultValues: {
      emails: [],
      role: 'team_member',
      projectId: project?.id || '',
      message: '',
      sendWelcomeEmail: true
    }
  });

  const watchedRole = watch('role');
  const watchedProjectId = watch('projectId');

  const handleAddEmail = () => {
    if (newEmail.trim() && !emails.includes(newEmail.trim())) {
      const updatedEmails = [...emails, newEmail.trim()];
      setEmails(updatedEmails);
      setValue('emails', updatedEmails);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedEmails = emails.filter(email => email !== emailToRemove);
    setEmails(updatedEmails);
    setValue('emails', updatedEmails);
    setInviteStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[emailToRemove];
      return newStatus;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full access to project settings and team management' },
    { value: 'project_manager', label: 'Project Manager', description: 'Can manage tasks, assign work, and view reports' },
    { value: 'team_member', label: 'Team Member', description: 'Can work on tasks and view project information' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to project information' }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'team_member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedProject = projects.find(p => p.id === watchedProjectId);
  const existingEmails = existingUsers.map(user => user.email.toLowerCase());

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Invite Team Members
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Invite new team members to collaborate on your project
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Project
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Project *
            </label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Choose a project"
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

          {selectedProject && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedProject.name}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {selectedProject.description}
              </p>
            </div>
          )}
        </div>

        {/* Email Invites */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Invite People
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Addresses *
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter email address"
                className="flex-1"
                type="email"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEmail}
                disabled={!newEmail.trim() || !validateEmail(newEmail.trim())}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            
            {emails.length > 0 && (
              <div className="space-y-2">
                {emails.map((email) => {
                  const isExisting = existingEmails.includes(email.toLowerCase());
                  const status = inviteStatus[email];
                  
                  return (
                    <div
                      key={email}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isExisting 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' 
                          : status === 'success'
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {email}
                        </span>
                        {isExisting && (
                          <Badge variant="warning" className="text-xs">
                            Already a member
                          </Badge>
                        )}
                        {status === 'success' && (
                          <Badge variant="success" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        )}
                        {status === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {errors.emails && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.emails.message}
              </p>
            )}
          </div>
        </div>

        {/* Role Assignment */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Role Assignment
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Role for Invitees
            </label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  error={errors.role?.message}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            />
            
            {watchedRole && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge className={`text-xs ${getRoleColor(watchedRole)}`}>
                    {roleOptions.find(r => r.value === watchedRole)?.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {roleOptions.find(r => r.value === watchedRole)?.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Invitation Message
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personal Message (Optional)
            </label>
            <Controller
              name="message"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              )}
            />
            {errors.message && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.message.message}
              </p>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Email Settings
          </h3>
          
          <div className="flex items-center space-x-3">
            <Controller
              name="sendWelcomeEmail"
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
                    Send welcome email with project information
                  </span>
                </label>
              )}
            />
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
            disabled={isSubmitting || isLoading || emails.length === 0}
            className="min-w-[120px]"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Invites...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invites ({emails.length})
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UserInviteForm; 