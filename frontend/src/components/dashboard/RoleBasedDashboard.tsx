import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  Clock,
  TrendingUp,
  AlertCircle,
  Target
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { Card } from '../ui/Card';

// Dashboard data types
interface BaseDashboardData {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  teamMembers: number;
  upcomingDeadlines: number;
}

interface AdminDashboardData extends BaseDashboardData {
  totalUsers: number;
  activeTeams: number;
  systemHealth: number;
  pendingApprovals: number;
}

interface ManagerDashboardData extends BaseDashboardData {
  myProjects: number;
  teamProjects: number;
  teamPerformance: number;
  budgetUtilization: number;
}

interface DeveloperDashboardData extends BaseDashboardData {
  myTasks: number;
  completedThisWeek: number;
  codeReviews: number;
  timeLogged: number;
}

interface QaDashboardData extends BaseDashboardData {
  testsExecuted: number;
  bugsFound: number;
  testCoverage: number;
  pendingTests: number;
}

// Mock data services - replace with actual service calls
const getDashboardData = async (userRole: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const baseData = {
    totalProjects: 12,
    activeProjects: 8,
    completedTasks: 145,
    pendingTasks: 23,
    teamMembers: 15,
    upcomingDeadlines: 3,
  };

  // Role-specific data modifications
  switch (userRole) {
    case 'admin':
      return {
        ...baseData,
        totalUsers: 50,
        activeTeams: 8,
        systemHealth: 98,
        pendingApprovals: 5,
      };
    case 'manager':
      return {
        ...baseData,
        myProjects: 4,
        teamProjects: 6,
        teamPerformance: 87,
        budgetUtilization: 65,
      };
    case 'developer':
      return {
        ...baseData,
        myTasks: 8,
        completedThisWeek: 12,
        codeReviews: 3,
        timeLogged: 38.5,
      };
    case 'qa':
      return {
        ...baseData,
        testsExecuted: 156,
        bugsFound: 23,
        testCoverage: 89,
        pendingTests: 7,
      };
    default:
      return baseData;
  }
};

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuthContext();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => getDashboardData(user?.role || 'developer'),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  const renderAdminDashboard = () => {
    if (!dashboardData) return null;
    const data = dashboardData as AdminDashboardData;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={data.totalUsers}
            icon={Users}
            color="blue"
            trend="+5.2%"
          />
          <StatCard
            title="Active Teams"
            value={data.activeTeams}
            icon={Users}
            color="green"
            trend="+2"
          />
          <StatCard
            title="Total Projects"
            value={data.totalProjects}
            icon={FolderOpen}
            color="purple"
            trend="+12%"
          />
          <StatCard
            title="System Health"
            value={`${data.systemHealth}%`}
            icon={TrendingUp}
            color="emerald"
            trend="Excellent"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions role="admin" />
          <RecentActivity role="admin" />
        </div>
      </>
    );
  };

  const renderManagerDashboard = () => {
    if (!dashboardData) return null;
    const data = dashboardData as ManagerDashboardData;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Projects"
            value={data.myProjects}
            icon={FolderOpen}
            color="blue"
            trend="+1"
          />
          <StatCard
            title="Team Projects"
            value={data.teamProjects}
            icon={Users}
            color="green"
            trend="Active"
          />
          <StatCard
            title="Team Performance"
            value={`${data.teamPerformance}%`}
            icon={TrendingUp}
            color="purple"
            trend="+3.1%"
          />
          <StatCard
            title="Budget Used"
            value={`${data.budgetUtilization}%`}
            icon={Target}
            color="orange"
            trend="On track"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions role="manager" />
          <RecentActivity role="manager" />
        </div>
      </>
    );
  };

  const renderDeveloperDashboard = () => {
    if (!dashboardData) return null;
    const data = dashboardData as DeveloperDashboardData;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Tasks"
            value={data.myTasks}
            icon={CheckSquare}
            color="blue"
            trend="2 new"
          />
          <StatCard
            title="Completed This Week"
            value={data.completedThisWeek}
            icon={TrendingUp}
            color="green"
            trend="+20%"
          />
          <StatCard
            title="Code Reviews"
            value={data.codeReviews}
            icon={AlertCircle}
            color="orange"
            trend="Pending"
          />
          <StatCard
            title="Time Logged"
            value={`${data.timeLogged}h`}
            icon={Clock}
            color="purple"
            trend="This week"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions role="developer" />
          <RecentActivity role="developer" />
        </div>
      </>
    );
  };

  const renderQaDashboard = () => {
    if (!dashboardData) return null;
    const data = dashboardData as QaDashboardData;
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tests Executed"
            value={data.testsExecuted}
            icon={CheckSquare}
            color="blue"
            trend="This week"
          />
          <StatCard
            title="Bugs Found"
            value={data.bugsFound}
            icon={AlertCircle}
            color="red"
            trend="+5 new"
          />
          <StatCard
            title="Test Coverage"
            value={`${data.testCoverage}%`}
            icon={TrendingUp}
            color="green"
            trend="+2.3%"
          />
          <StatCard
            title="Pending Tests"
            value={data.pendingTests}
            icon={Clock}
            color="orange"
            trend="Priority"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions role="qa" />
          <RecentActivity role="qa" />
        </div>
      </>
    );
  };

  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'admin':
        return renderAdminDashboard();
      case 'manager':
        return renderManagerDashboard();
      case 'developer':
        return renderDeveloperDashboard();
      case 'qa':
        return renderQaDashboard();
      default:
        return renderDeveloperDashboard();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your {user.role === 'admin' ? 'organization' : 
          user.role === 'manager' ? 'team' : 'work'} today.
        </p>
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
            ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
              user.role === 'developer' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
            <LayoutDashboard className="h-4 w-4 mr-1" />
            {user.role} Dashboard
          </span>
        </div>
      </div>

      {/* Role-specific content */}
      {renderDashboardByRole()}
    </div>
  );
};

// Reusable StatCard component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

// Quick Actions component
interface QuickActionsProps {
  role: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ role }) => {
  const getQuickActions = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Manage Users', icon: Users, action: () => {} },
          { label: 'View Reports', icon: TrendingUp, action: () => {} },
          { label: 'System Settings', icon: LayoutDashboard, action: () => {} },
        ];
      case 'manager':
        return [
          { label: 'Create Project', icon: FolderOpen, action: () => {} },
          { label: 'Assign Tasks', icon: CheckSquare, action: () => {} },
          { label: 'Team Reports', icon: TrendingUp, action: () => {} },
        ];
      case 'developer':
        return [
          { label: 'View My Tasks', icon: CheckSquare, action: () => {} },
          { label: 'Log Time', icon: Clock, action: () => {} },
          { label: 'Code Reviews', icon: AlertCircle, action: () => {} },
        ];
      case 'qa':
        return [
          { label: 'Test Cases', icon: CheckSquare, action: () => {} },
          { label: 'Bug Reports', icon: AlertCircle, action: () => {} },
          { label: 'Test Results', icon: TrendingUp, action: () => {} },
        ];
      default:
        return [];
    }
  };

  const actions = getQuickActions();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="w-full flex items-center p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <action.icon className="h-5 w-5 mr-3 text-gray-500" />
            {action.label}
          </button>
        ))}
      </div>
    </Card>
  );
};

// Recent Activity component
interface RecentActivityProps {
  role: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ role }) => {
  const getRecentActivity = () => {
    switch (role) {
      case 'admin':
        return [
          { text: 'New user registered: John Smith', time: '2 hours ago' },
          { text: 'System backup completed', time: '4 hours ago' },
          { text: 'Security audit passed', time: '1 day ago' },
        ];
      case 'manager':
        return [
          { text: 'Project "Dashboard" milestone reached', time: '1 hour ago' },
          { text: 'Team meeting scheduled for tomorrow', time: '3 hours ago' },
          { text: 'Budget approval for Q2', time: '1 day ago' },
        ];
      case 'developer':
        return [
          { text: 'Code review approved for PR #123', time: '30 min ago' },
          { text: 'Task "Fix login bug" completed', time: '2 hours ago' },
          { text: 'Deployed to staging environment', time: '5 hours ago' },
        ];
      case 'qa':
        return [
          { text: 'Test suite execution completed', time: '1 hour ago' },
          { text: 'Bug #456 verified and closed', time: '3 hours ago' },
          { text: 'Test coverage report generated', time: '6 hours ago' },
        ];
      default:
        return [];
    }
  };

  const activities = getRecentActivity();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.text}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
