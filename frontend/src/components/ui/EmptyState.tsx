import React from 'react';
import { Button } from './Button';
import { 
  FolderOpen, 
  Search, 
  AlertCircle, 
  Plus, 
  Users, 
  MessageSquare,
  Clock,
  FileText,
  Activity
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  className?: string;
}

const defaultIcons = {
  projects: <FolderOpen className="h-12 w-12 text-gray-400" />,
  tasks: <FileText className="h-12 w-12 text-gray-400" />,
  users: <Users className="h-12 w-12 text-gray-400" />,
  comments: <MessageSquare className="h-12 w-12 text-gray-400" />,
  time: <Clock className="h-12 w-12 text-gray-400" />,
  activity: <Activity className="h-12 w-12 text-gray-400" />,
  search: <Search className="h-12 w-12 text-gray-400" />,
  error: <AlertCircle className="h-12 w-12 text-red-400" />
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-center">
        {icon && (
          <div className="flex justify-center mb-4">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            {description}
          </p>
        )}
        
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{action.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyProjects: React.FC<{ onCreateProject: () => void }> = ({ onCreateProject }) => (
  <EmptyState
    icon={defaultIcons.projects}
    title="No projects yet"
    description="Get started by creating your first project to organize your work and collaborate with your team."
    action={{
      label: 'Create Project',
      onClick: onCreateProject,
      variant: 'primary'
    }}
  />
);

export const EmptyTasks: React.FC<{ onCreateTask: () => void }> = ({ onCreateTask }) => (
  <EmptyState
    icon={defaultIcons.tasks}
    title="No tasks found"
    description="Create your first task to start tracking your work and progress."
    action={{
      label: 'Create Task',
      onClick: onCreateTask,
      variant: 'primary'
    }}
  />
);

export const EmptySearch: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <EmptyState
    icon={defaultIcons.search}
    title={`No results for "${searchTerm}"`}
    description="Try adjusting your search terms or filters to find what you're looking for."
  />
);

export const EmptyComments: React.FC = () => (
  <EmptyState
    icon={defaultIcons.comments}
    title="No comments yet"
    description="Be the first to start a conversation by adding a comment."
  />
);

export const EmptyTimeLogs: React.FC = () => (
  <EmptyState
    icon={defaultIcons.time}
    title="No time logs"
    description="Start tracking your time to monitor project progress and productivity."
  />
);

export const EmptyTeam: React.FC<{ onInviteMembers: () => void }> = ({ onInviteMembers }) => (
  <EmptyState
    icon={defaultIcons.users}
    title="No team members"
    description="Invite team members to collaborate on projects and tasks."
    action={{
      label: 'Invite Members',
      onClick: onInviteMembers,
      variant: 'outline'
    }}
  />
);

export const EmptyActivity: React.FC = () => (
  <EmptyState
    icon={defaultIcons.activity}
    title="No recent activity"
    description="Activity will appear here as you and your team work on projects."
  />
); 