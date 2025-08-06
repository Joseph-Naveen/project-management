import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import TaskForm from '../components/forms/TaskForm';
import { 
  Plus, 
  Search, 
  Calendar,
  Flag,
  MessageSquare,
  Paperclip,
  MoreVertical
} from 'lucide-react';
import type { Task, User, Project, CreateTaskRequest } from '../types';
import { useProgressUpdates } from '../hooks/useProgressUpdates';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { ROUTES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { KanbanBoard } from '../components/features/KanbanBoard';

export const TasksPage = () => {
  const navigate = useNavigate();
  const { onTaskStatusChange } = useProgressUpdates();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers({ isActive: true });
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectService.getProjects();
      if (response.success && response.data) {
        setProjects(response.data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectFilter) params.projectId = projectFilter;
      if (assigneeFilter) params.assigneeId = assigneeFilter;
      
      const response = await taskService.getTasks(params);
      
      if (response.success && response.data) {
        setTasks(response.data.tasks);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, projectFilter, assigneeFilter]);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, [fetchUsers, fetchProjects]);

  // Fetch tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    try {
      setCreateLoading(true);
      const response = await taskService.createTask(taskData);
      if (response.success) {
        setShowCreateModal(false);
        fetchTasks(); // Refresh the tasks list
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                       task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      const matchesAssignee = !assigneeFilter || task.assignee?.id === assigneeFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  };

  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, newStatus);
      if (response.success) {
        // Update the task in the local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
        
        // Find the task to get its project ID
        const task = tasks.find(t => t.id === taskId);
        if (task?.projectId) {
          // Trigger progress bar updates across the application
          await onTaskStatusChange(taskId, task.projectId, newStatus);
        }
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleTaskClick = (taskId: string) => {
    // Navigate to task detail page using React Router
    navigate(`${ROUTES.TASKS}/${taskId}`);
  };

  const handleAddTask = (status: Task['status']) => {
    // Open add task modal or navigate to create task page
    console.log('Add task with status:', status);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo':
        return 'secondary';
      case 'in_progress':
        return 'warning';
      case 'review':
        return 'info';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'default';
      case 'medium':
        return 'warning';
      case 'high':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (hours: number) => {
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTasks}>Retry</Button>
        </div>
      </div>
    );
  }

  const filteredTasks = filterTasks(tasks);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">Manage and track your project tasks</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'outline'}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              placeholder="Filter by project"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filter by status"
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              placeholder="Filter by priority"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <Select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              placeholder="Filter by assignee"
            >
              <option value="">All Assignees</option>
              {users.filter(user => user.isActive).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Mode */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <Link 
                          to={`${ROUTES.TASKS}/${task.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {task.title}
                        </Link>
                      </h3>
                      <Badge variant={getStatusVariant(task.status)}>
                        {task.status?.replace('_', ' ') || 'No Status'}
                      </Badge>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {task.priority || 'No Priority'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Flag className="w-4 h-4" />
                        {task.estimatedHours ? formatTime(task.estimatedHours) : 'Not set'}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {task.commentCount || 0}
                      </div>
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-4 h-4" />
                          {task.attachments.length}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {task.assignee && (
                      <Avatar
                        size="sm"
                        alt={task.assignee.name}
                        src={task.assignee.avatar}
                      />
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Kanban View */
        <KanbanBoard
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
      )}

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          users={users}
          projects={projects}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createLoading}
        />
      </Modal>
    </div>
  );
};