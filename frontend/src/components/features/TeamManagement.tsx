import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Users as UsersIcon } from 'lucide-react';
import { teamService } from '../../services/teamService';
import { useAuthContext } from '../../context/AuthContext';
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '../../types/models';

export const TeamManagement: React.FC = () => {
  const { user, hasAnyRole } = useAuthContext();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Fetch teams
  const { data: teamsResponse, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (teamData: CreateTeamRequest) => teamService.createTeam(teamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateModal(false);
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamRequest }) =>
      teamService.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setEditingTeam(null);
    },
  });

  // Delete team mutation (admin only)
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamService.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  // Only allow admin/manager to access this component
  if (!hasAnyRole(['admin', 'manager'])) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <UsersIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to manage teams.</p>
        </div>
      </div>
    );
  }

  const teams = teamsResponse?.data || [];

  const handleDeleteTeam = (team: Team) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can delete teams.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the team "${team.name}"?`)) {
      deleteTeamMutation.mutate(team.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load teams. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage teams and their members</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Teams List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team) => (
          <div key={team.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                {team.description && (
                  <p className="text-gray-600 text-sm mt-1">{team.description}</p>
                )}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setEditingTeam(team)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit team"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteTeam(team)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete team"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Team Manager */}
            {team.manager && (
              <div className="mb-3">
                <p className="text-sm text-gray-500">Manager</p>
                <p className="text-sm font-medium text-gray-900">{team.manager.name}</p>
              </div>
            )}

            {/* Team Status */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                team.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {team.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500">
                Created {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <TeamFormModal
          title="Create New Team"
          onSubmit={(data) => {
            const createData: CreateTeamRequest = {
              name: data.name!,
              description: data.description,
              managerId: data.managerId,
            };
            createTeamMutation.mutate(createData);
          }}
          onClose={() => setShowCreateModal(false)}
          isLoading={createTeamMutation.isPending}
        />
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <TeamFormModal
          title="Edit Team"
          team={editingTeam}
          onSubmit={(data) => {
            const updateData: UpdateTeamRequest = {
              name: data.name,
              description: data.description,
              managerId: data.managerId,
              isActive: data.isActive,
            };
            updateTeamMutation.mutate({ id: editingTeam.id, data: updateData });
          }}
          onClose={() => setEditingTeam(null)}
          isLoading={updateTeamMutation.isPending}
        />
      )}
    </div>
  );
};

// Team Form Modal Component
interface TeamFormModalProps {
  title: string;
  team?: Team;
  onSubmit: (data: { 
    name?: string; 
    description?: string; 
    managerId?: string; 
    isActive?: boolean;
  }) => void;
  onClose: () => void;
  isLoading: boolean;
}

const TeamFormModal: React.FC<TeamFormModalProps> = ({
  title,
  team,
  onSubmit,
  onClose,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    managerId: team?.managerId || '',
    isActive: team?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({
      name: formData.name,
      description: formData.description || undefined,
      managerId: formData.managerId || undefined,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Team Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {team && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Team is active</span>
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : team ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
