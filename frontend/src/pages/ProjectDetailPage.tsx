import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Plus,
  Filter,
  Edit3,
  Trash2
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Badge, 
  Avatar, 
  Button,
  Modal,
  LoadingSpinner
} from '../components/ui';
import { ProjectTimeline } from '../components/features';
import ProjectForm from '../components/forms/ProjectForm';
import TaskForm from '../components/forms/TaskForm';
import { ROUTES } from '../constants';
import type { Task, Project, User } from '../types';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'team'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [taskCreateLoading, setTaskCreateLoading] = useState(false);
  
  // State for real data
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Team management state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('member');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removeMemberLoading, setRemoveMemberLoading] = useState<string | null>(null);

  const handleUpdateProject = async (formData: {
    name: string;
    description?: string;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    startDate?: string;
    endDate?: string;
    budget?: number;
    tags: string[];
    ownerId: string;
    members?: string[];
  }) => {
    if (!project || !id) return;
    
    console.log('🔄 Updating project with data:', formData);
    setUpdateLoading(true);
    try {
      // Transform form data to match API expectations
      const updateData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget,
        tags: formData.tags,
        ownerId: formData.ownerId,
        members: formData.members // This will be string[] from form
      };

      const response = await projectService.updateProject(id, updateData);
      if (response.success && response.data) {
        // Just refresh the project data to get the latest state
        console.log('✅ Project updated successfully');
        setShowEditModal(false);
        await fetchProjectData();
      } else {
        console.error('❌ Failed to update project:', response.errors);
      }
    } catch (error) {
      console.error('❌ Error updating project:', error);
      setError('Failed to update project. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigneeId?: string;
    projectId: string;
    dueDate?: string;
    estimatedHours?: number;
    labels?: string[];
    dependencies?: string[];
  }) => {
    if (!project || !id) return;
    
    setTaskCreateLoading(true);
    try {
      // Ensure projectId is set to current project
      const createData = {
        ...taskData,
        projectId: id
      };

      const response = await taskService.createTask(createData);
      if (response.success) {
        setShowTaskModal(false);
        // Refresh tasks list
        fetchProjectData();
      } else {
        console.error('Failed to create task:', response.errors);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setTaskCreateLoading(false);
    }
  };

  // Team management handlers
  const handleAddMember = async () => {
    if (!selectedUser || !id) return;
    
    setAddMemberLoading(true);
    try {
      const response = await projectService.addProjectMember(id, selectedUser, selectedRole);
      
      if (response.success) {
        setShowAddMemberModal(false);
        setSelectedUser('');
        setSelectedRole('member');
        // Refresh project data to get updated members
        await fetchProjectData();
      } else {
        console.error('Failed to add member:', response.errors);
      }
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !confirm('Are you sure you want to remove this member from the project?')) return;
    
    setRemoveMemberLoading(userId);
    try {
      const response = await projectService.removeProjectMember(id, userId);
      
      if (response.success) {
        // Refresh project data to get updated members
        await fetchProjectData();
      } else {
        console.error('Failed to remove member:', response.errors);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setRemoveMemberLoading(null);
    }
  };

  const fetchProjectData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch project details with full relationships
      const projectResponse = await projectService.getProjectById(id);
      if (projectResponse.success && projectResponse.data) {
        // Backend returns either Project directly or wrapped in { project: Project }
        const responseData = projectResponse.data as Project | { project: Project };
        const projectData = 'project' in responseData ? responseData.project : responseData;
        setProject(projectData);
        console.log('📁 Project data loaded:', projectData);
      } else {
        throw new Error('Failed to fetch project details');
      }
      
      // Fetch project tasks
      const tasksResponse = await taskService.getTasks({ projectId: id });
      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data.tasks);
        console.log('📋 Tasks loaded:', tasksResponse.data.tasks.length);
      }
      
      // Fetch users for team tab and forms
      const usersResponse = await userService.getUsers();
      if (usersResponse.success && usersResponse.data) {
        const allUsers = usersResponse.data.users;
        setUsers(allUsers);
        
        // Filter project managers for the owner dropdown
        const managers = allUsers.filter(user => 
          user.role === 'manager' || user.role === 'admin'
        );
        setProjectManagers(managers);
        console.log('👥 Users loaded:', allUsers.length, 'Managers:', managers.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project data';
      setError(errorMessage);
      console.error('❌ Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch project data on component mount
  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id, fetchProjectData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'info';
      case 'on_hold': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'in_progress': return 'info';
      case 'todo': return 'secondary';
      default: return 'default';
    }
  };

  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <Button onClick={fetchProjectData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Project not found</p>
          <Link to={ROUTES.PROJECTS}>
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining(project.endDate || new Date().toISOString());

  const handleTaskClick = (taskId: string) => {
    navigate(`${ROUTES.TASKS}/${taskId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={ROUTES.PROJECTS}>
                <Button variant="outline" size="sm" className="hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{project.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Project Manager: {project.owner?.name || 'Not assigned'}</span>
                  <span>•</span>
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <Badge variant={getStatusColor(project.status)} className="capitalize">
                    {project.status?.replace('_', ' ') || 'No Status'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="hover:bg-blue-50 hover:text-blue-600">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{project.progress}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Budget</p>
                <p className="text-2xl font-bold text-gray-900">${(project.budget || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">of ${(project.budget || 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="text-2xl font-bold text-gray-900">{daysRemaining}</p>
                <p className="text-xs text-gray-500">days remaining</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Team</p>
                <p className="text-2xl font-bold text-gray-900">{project.members?.length || 0}</p>
                <p className="text-xs text-gray-500">members</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'tasks', 'timeline', 'team'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'overview' | 'tasks' | 'timeline' | 'team')}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <Card>
              <CardHeader title="Project Overview" />
              <CardContent>
                {project ? (
                  <div className="space-y-6">
                    {/* Project Name & Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Project Name</h4>
                      <p className="text-lg font-medium text-gray-800">{project.name}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Description</h4>
                      <p className="text-gray-600 leading-relaxed">
                        {project.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Status & Priority Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Status</h4>
                        <Badge variant={getStatusColor(project.status)} className="capitalize">
                          {project.status?.replace('_', ' ') || 'No Status'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Priority</h4>
                        <Badge variant={getPriorityColor(project.priority)} className="capitalize">
                          {project.priority || 'No Priority'}
                        </Badge>
                      </div>
                    </div>

                    {/* Project Manager */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Project Manager</h4>
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          size="sm" 
                          alt={project.owner?.name || 'Project Manager'} 
                          src={project.owner?.avatar || ''} 
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {project.owner?.name || 'Not assigned'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {project.owner?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Start Date</h4>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-600">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">End Date</h4>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-600">
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Progress Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Budget</h4>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-600">
                            {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Progress</h4>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{project.progress || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Created</h4>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-600">
                          {new Date(project.createdAt).toLocaleDateString()} at {new Date(project.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading project data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'tasks' && (
            <Card>
              <CardHeader title="Tasks">
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={() => setShowTaskModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Assigned to: {task.assignee?.name || 'Unassigned'}</span>
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getPriorityColor(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                        <Badge variant={getTaskStatusColor(task.status)} size="sm">
                          {task.status?.replace('_', ' ') || 'No Status'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <ProjectTimeline
              tasks={tasks}
              onTaskClick={handleTaskClick}
              className="w-full"
            />
          )}

          {activeTab === 'team' && (
            <Card>
              <CardHeader title="Team Members">
                <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Owner */}
                  {project?.owner && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar size="md" alt={project.owner.name} src={project.owner.avatar} />
                          <div>
                            <h4 className="font-medium text-gray-900">{project.owner.name}</h4>
                            <p className="text-sm text-gray-500">Project Manager</p>
                            <p className="text-xs text-gray-400">{project.owner.email}</p>
                          </div>
                        </div>
                        <Badge variant="info" size="sm">Owner</Badge>
                      </div>
                    </div>
                  )}

                  {/* Project Members */}
                  {project?.members && project.members.length > 0 ? (
                    project.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            size="md" 
                            alt={member.user?.name || 'Team Member'} 
                            src={member.user?.avatar || ''} 
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {member.user?.name || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-gray-500 capitalize">
                              {member.user?.role || 'Team Member'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {member.user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" size="sm" className="capitalize">
                            {member.role}
                          </Badge>
                          {member.role !== 'owner' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={removeMemberLoading === member.userId}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {removeMemberLoading === member.userId ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No team members added yet</p>
                      <Button size="sm" className="mt-2" onClick={() => setShowAddMemberModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Member
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Manager */}
          <Card>
            <CardHeader title="Project Manager" />
            <CardContent>
              <div className="flex items-center space-x-3">
                <Avatar 
                  size="lg" 
                  alt={project?.owner?.name || 'Project Manager'} 
                  src={project?.owner?.avatar || ''} 
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {project?.owner?.name || 'Not assigned'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {project?.owner?.email || 'No email'}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {project?.owner?.role || 'Project Manager'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card>
            <CardHeader title="Project Statistics" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-semibold text-gray-900">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Tasks</span>
                  <span className="font-semibold text-green-600">
                    {tasks.filter(task => task.status === 'done').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Team Members</span>
                  <span className="font-semibold text-gray-900">{users.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-semibold text-blue-600">{project?.progress || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
        size="lg"
      >
        <div className="space-y-4">
          {project && (
            <ProjectForm
              project={project}
              users={projectManagers}
              onSubmit={handleUpdateProject}
              onCancel={() => setShowEditModal(false)}
              isLoading={updateLoading}
              key={project.id} // Force re-render when project changes
            />
          )}
        </div>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Create New Task"
        size="lg"
      >
        <div className="space-y-4">
          <TaskForm
            projects={project ? [project] : []}
            users={users}
            currentProjectId={project?.id}
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskModal(false)}
            isLoading={taskCreateLoading}
            key={`task-form-${project?.id}`} // Force re-render when project changes
          />
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Team Member"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a user...</option>
              {users
                .filter(user => 
                  // Exclude users who are already project members
                  !project?.members?.some(member => member.userId === user.id) &&
                  // Exclude project owner
                  project?.owner?.id !== user.id
                )
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))
              }
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'admin' | 'member' | 'viewer')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="member">Team Member</option>
              <option value="admin">Admin</option>
              <option value="admin">Project Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddMemberModal(false)}
              disabled={addMemberLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser || addMemberLoading}
              loading={addMemberLoading}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};