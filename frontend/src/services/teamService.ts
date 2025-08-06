import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '../types';

class TeamService {
  // Get all teams
  async getTeams(): Promise<ApiResponse<Team[]>> {
    try {
      return await apiClient.get('/teams');
    } catch (error) {
      console.error('Get teams error:', error);
      throw error;
    }
  }

  // Get team by ID
  async getTeamById(id: string): Promise<ApiResponse<Team>> {
    try {
      return await apiClient.get(`/teams/${id}`);
    } catch (error) {
      console.error('Get team error:', error);
      throw error;
    }
  }

  // Create new team
  async createTeam(teamData: CreateTeamRequest): Promise<ApiResponse<Team>> {
    try {
      return await apiClient.post('/teams', teamData);
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  }

  // Update team
  async updateTeam(id: string, teamData: UpdateTeamRequest): Promise<ApiResponse<Team>> {
    try {
      return await apiClient.put(`/teams/${id}`, teamData);
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  }

  // Delete team
  async deleteTeam(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiClient.delete(`/teams/${id}`);
    } catch (error) {
      console.error('Delete team error:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService();
