import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Modal, LoadingSpinner, Badge } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Users, UserPlus, Settings, Edit3, Trash2 } from 'lucide-react';
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '../types';
import { userService } from '../services/userService';
import { teamService } from '../services/teamService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface TeamStats {
  totalMembers: number;
  activeProjects: number;
  projectsInProgress: number;
  totalTeams: number;
}

interface TeamFormData {
  name: string;
  description: string;
  managerId: string;
}

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    managerId: ''
  });

  // Fetch teams
  const { data: teamsResponse, isLoading: teamsLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  });

  // Fetch users for manager selection
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Get team stats
  const { data: statsResponse } = useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      // Mock implementation - in real app this would be an API call
      const teams = teamsResponse?.data || [];
      const users = usersResponse?.data?.users || [];
      
      return {
        totalMembers: users.length,
        activeProjects: 8, // This should come from API
        projectsInProgress: 5, // This should come from API  
        totalTeams: teams.length
      } as TeamStats;
    },
    enabled: !!teamsResponse && !!usersResponse
  });

  const teams = teamsResponse?.data || [];
  const users = usersResponse?.data?.users || [];
  const managerUsers = users.filter(user => user.role === 'admin' || user.role === 'manager');
  const stats = statsResponse || { totalMembers: 0, activeProjects: 0, projectsInProgress: 0, totalTeams: 0 };

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (teamData: CreateTeamRequest) => teamService.createTeam(teamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Team created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create team');
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamRequest }) =>
      teamService.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      setShowEditModal(false);
      setEditingTeam(null);
      resetForm();
      toast.success('Team updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update team');
    }
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamService.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('Team deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete team');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      managerId: ''
    });
  };

  const handleCreateTeam = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditTeam = (team: Team) => {
    setFormData({
      name: team.name,
      description: team.description || '',
      managerId: team.managerId || ''
    });
    setEditingTeam(team);
    setShowEditModal(true);
  };

  const handleDeleteTeam = (team: Team) => {
    if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      deleteTeamMutation.mutate(team.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    const teamData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      managerId: formData.managerId || undefined,
    };

    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data: teamData });
    } else {
      createTeamMutation.mutate(teamData);
    }
  };

  if (teamsLoading || usersLoading) {
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
          <p className="text-red-600 mb-4">Failed to load teams. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage teams and their members</p>
        </div>
        <Button 
          className="flex items-center space-x-2"
          onClick={handleCreateTeam}
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Team</span>
        </Button>
      </div>

      {/* Team Stats - Now with dynamic data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Total Members</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
            <p className="text-sm text-gray-600 mt-1">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Active Projects</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
            <p className="text-sm text-gray-600 mt-1">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Projects in Progress</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.projectsInProgress}</p>
            <p className="text-sm text-gray-600 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Total Teams</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTeams}</p>
            <p className="text-sm text-gray-600 mt-1">Teams created</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Teams</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-gray-600">{team.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      {team.manager && (
                        <Badge variant="outline" size="sm">
                          Manager: {team.manager.name}
                        </Badge>
                      )}
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditTeam(team)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteTeam(team)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No teams found</p>
                <p className="text-sm text-gray-400 mt-1">Create your first team to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Team"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter team name"
            required
          />
          
          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter team description"
          />

          <Select
            label="Team Manager (Optional)"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          >
            <option value="">Select a manager</option>
            {managerUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </Select>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTeam(null);
          resetForm();
        }}
        title="Edit Team"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter team name"
            required
          />
          
          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter team description"
          />

          <Select
            label="Team Manager (Optional)"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          >
            <option value="">Select a manager</option>
            {managerUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </Select>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingTeam(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTeamMutation.isPending}
            >
              {updateTeamMutation.isPending ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}; 