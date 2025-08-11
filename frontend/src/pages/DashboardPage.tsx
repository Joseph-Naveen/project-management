import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Avatar, Button, LoadingSpinner } from '../components/ui';
import { ROUTES } from '../constants';
import { dashboardService } from '../services';
import { calculateProjectProgress } from '../utils/progressCalculations';

export const DashboardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Helper function for greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data...');

      // Fetch dashboard stats
      const statsResponse = await dashboardService.getDashboardStats();
      console.log('📊 Stats response:', statsResponse);
      if (statsResponse.success && statsResponse.data) {
        // API returns { data: { stats: { ... } } }
        const statsData = statsResponse.data.stats;
        console.log('📊 Stats data:', statsData);
        setStats(statsData);
      } else {
        console.error('❌ Stats response failed:', statsResponse);
      }

      // Fetch recent projects
      const projectsResponse = await dashboardService.getRecentProjects();
      console.log('📂 Projects response:', projectsResponse);
      if (projectsResponse.success && projectsResponse.data) {
        // API returns { data: { projects: [...] } }
        const projectsData = projectsResponse.data.projects || [];
        console.log('📂 Projects data:', projectsData);
        setRecentProjects(projectsData);
      } else {
        console.error('❌ Projects response failed:', projectsResponse);
      }

      // Fetch recent activity (global); fallback to user's own activity if empty
      const activityResponse = await dashboardService.getRecentActivity();
      console.log('🔔 Activity response:', activityResponse);
      if (activityResponse.success && activityResponse.data) {
        // API returns { data: { activities: [...] } }
        let activitiesData = activityResponse.data.activities || [];
        if (activitiesData.length === 0) {
          try {
            const myAct = await (await import('../services/userService')).userService.getMyActivity(10);
            if (myAct.success && myAct.data) {
              activitiesData = myAct.data.activities.map((a: any) => ({
                id: a.id,
                description: a.description,
                createdAt: a.createdAt,
                actor: { name: 'You' },
              }));
            }
          } catch {}
        }
        console.log('🔔 Activities data:', activitiesData);
        setRecentActivity(activitiesData);
      } else {
        console.error('❌ Activity response failed:', activityResponse);
      }

      console.log('✅ Dashboard data fetch completed');

    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('💥 Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'review':
        return 'warning';
      case 'planning':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="heading-xl mb-2">Good {getGreeting()}, Welcome back!</h1>
          <p className="text-muted text-lg">Here's what's happening with your projects today.</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="text-subtle text-sm">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <Link to={ROUTES.PROJECTS}>
            <Button className="btn-primary">
              <FolderOpen className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Total Projects</div>
              <div className="stat-value">{stats?.totalProjects ?? 0}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Active Projects</div>
              <div className="stat-value">{stats?.activeProjects ?? 0}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Completed Tasks</div>
              <div className="stat-value">{stats?.completedTasks ?? 0}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <CheckSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Hours Logged</div>
              <div className="stat-value">{stats?.totalTimeThisWeek ?? 0}</div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="xl:col-span-2">
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-md">Recent Projects</h2>
                <p className="text-muted mt-1">Your most active projects</p>
              </div>
              <Link to={ROUTES.PROJECTS}>
                <Button className="btn-secondary">View All</Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-all duration-200 hover-lift"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="heading-sm text-gray-900 truncate">
                          {project.name}
                        </h4>
                        <span className={`badge badge-${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {project.owner?.name || 'Unknown'}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-subtle mb-2">
                          <span>Progress</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateProjectProgress(project)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-subtle">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No recent projects</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity & Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="card-elevated p-6">
            <h2 className="heading-md mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex space-x-3">
                    <Avatar size="sm" alt={activity.actor?.name || 'User'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-subtle mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-subtle">
                  <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
            {recentActivity.length > 0 && (
              <div className="mt-6 text-center">
                <Button className="btn-secondary">View All Activity</Button>
              </div>
            )}
          </div>
          {/* Quick Actions */}
          <div className="card-elevated p-6">
            <h2 className="heading-md mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link to={ROUTES.PROJECTS} className="block">
                <button className="w-full flex items-center p-3 text-left bg-gray-50/50 hover:bg-gray-50 rounded-xl transition-all duration-200 hover-lift">
                  <div className="p-2 bg-blue-50 rounded-lg mr-3">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">Create Project</span>
                </button>
              </Link>
              
              <Link to={ROUTES.TASKS} className="block">
                <button className="w-full flex items-center p-3 text-left bg-gray-50/50 hover:bg-gray-50 rounded-xl transition-all duration-200 hover-lift">
                  <div className="p-2 bg-green-50 rounded-lg mr-3">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">Add Task</span>
                </button>
              </Link>
              
              <Link to={ROUTES.TIMESHEET} className="block">
                <button className="w-full flex items-center p-3 text-left bg-gray-50/50 hover:bg-gray-50 rounded-xl transition-all duration-200 hover-lift">
                  <div className="p-2 bg-purple-50 rounded-lg mr-3">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">Log Time</span>
                </button>
              </Link>
              
              <Link to={ROUTES.REPORTS} className="block">
                <button className="w-full flex items-center p-3 text-left bg-gray-50/50 hover:bg-gray-50 rounded-xl transition-all duration-200 hover-lift">
                  <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="font-medium text-gray-900">View Reports</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};