import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarGroup } from '../components/ui/Avatar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import ProjectForm from '../components/forms/ProjectForm';
import { 
  Plus, 
  Search, 
  Calendar,
  Users,
  Clock,
  MoreVertical,
  TrendingUp,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';
import type { Project, User, CreateProjectRequest } from '../types';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { ROUTES } from '../constants';
import { Link } from 'react-router-dom';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Fetch projects and users on component mount
  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateProject = async (projectData: CreateProjectRequest) => {
    try {
      setCreateLoading(true);
      const response = await projectService.createProject(projectData);
      if (response.success) {
        setShowCreateModal(false);
        fetchProjects(); // Refresh the projects list
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      const response = await projectService.getProjects(params);
      
      if (response.success && response.data) {
        setProjects(response.data.projects);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchProjects();
  }, [searchTerm, statusFilter, priorityFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'success';
      case 'review':
        return 'warning';
      case 'planning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Handle dropdown toggle
  const toggleDropdown = (projectId: string) => {
    const newDropdowns = new Set(openDropdowns);
    if (newDropdowns.has(projectId)) {
      newDropdowns.delete(projectId);
    } else {
      newDropdowns.clear(); // Close other dropdowns
      newDropdowns.add(projectId);
    }
    setOpenDropdowns(newDropdowns);
  };

  // Handle project delete
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setShowDeleteConfirm(true);
    setOpenDropdowns(new Set()); // Close dropdowns
  };

  // Confirm delete project
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setDeleteLoading(projectToDelete.id);
      const response = await projectService.deleteProject(projectToDelete.id);
      
      if (response.success) {
        // Remove project from state
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
      } else {
        alert('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Delete project error:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle edit project
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
    setOpenDropdowns(new Set());
  };

  // Handle update project
  const handleUpdateProject = async (data: CreateProjectRequest) => {
    if (!editingProject) return;

    try {
      setUpdateLoading(true);
      const response = await projectService.updateProject(editingProject.id, data);
      
      if (response.success && response.data) {
        // Handle both response formats: direct Project or wrapped { project: Project }
        const responseData = response.data as Project | { project: Project };
        const updatedProject = 'project' in responseData ? responseData.project : responseData;
        
        // Update project in state with the complete response data
        setProjects(projects.map(p => 
          p.id === editingProject.id ? updatedProject : p
        ));
        setShowEditModal(false);
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Update project error:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns(new Set());
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
          <Button onClick={fetchProjects}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage and track your project progress</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-xl font-semibold text-gray-900">{projects.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-xl font-semibold text-gray-900">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                {/* TrendingUp icon was removed from imports, so this will cause an error */}
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-xl font-semibold text-gray-900">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl font-semibold text-gray-900">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
        >
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
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
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(project.id);
                    }}
                    disabled={deleteLoading === project.id}
                  >
                    {deleteLoading === project.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <MoreVertical className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {openDropdowns.has(project.id) && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenDropdowns(new Set())}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                      <button
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(project);
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Project
                      </button>
                      <hr className="my-1" />
                      <button
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id, project.name);
                        }}
                        disabled={deleteLoading === project.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Badge variant={getStatusVariant(project.status)}>
                  {project.status}
                </Badge>
                <Badge variant={getPriorityVariant(project.priority)}>
                  {project.priority}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Start Date</span>
                  <p className="font-medium">{project.startDate ? formatDate(project.startDate) : 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Due Date</span>
                  <p className="font-medium">{project.endDate ? formatDate(project.endDate) : 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Budget</span>
                  <p className="font-medium">{project.budget ? formatCurrency(project.budget) : 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Team</span>
                  <p className="font-medium">{project.members?.length || 0} members</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  to={`${ROUTES.PROJECTS}/${project.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details →
                </Link>
                <div className="flex items-center space-x-1">
                  <AvatarGroup max={3}>
                    {project.members?.slice(0, 3).map((member) => (
                      <Avatar
                        key={member.id}
                        size="sm"
                        alt={member.user?.name || 'Team Member'}
                        src={member.user?.avatar}
                      />
                    ))}
                  </AvatarGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found</p>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
      >
        <ProjectForm
          users={users}
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createLoading}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProject(null);
        }}
        title="Edit Project"
        size="lg"
      >
        {editingProject && (
          <ProjectForm
            project={editingProject}
            users={users}
            onSubmit={handleUpdateProject}
            onCancel={() => {
              setShowEditModal(false);
              setEditingProject(null);
            }}
            isLoading={updateLoading}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={
          projectToDelete 
            ? `Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone and will permanently remove all project data, tasks, and associated files.`
            : ''
        }
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading === projectToDelete?.id}
      />
    </div>
  );
};