import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { RoleBasedDashboard } from '../components/dashboard/RoleBasedDashboard';
import { TeamManagement } from '../components/features/TeamManagement';
import { LoginTest } from '../components/LoginTest';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Shield, 
  Users, 
  Settings, 
  FolderPlus,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react';

export const RoleBasedFeaturesDemo: React.FC = () => {
  const { user, hasAnyRole } = useAuthContext();
  const [activeDemo, setActiveDemo] = React.useState<'dashboard' | 'teams' | 'permissions' | 'login'>('dashboard');
  const [showLoginTest, setShowLoginTest] = React.useState(false);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view role-based features.</p>
      </div>
    );
  }

  const renderPermissionsDemo = () => {
    const features = [
      {
        name: 'User Management',
        requiredRoles: ['admin'],
        icon: Shield,
        description: 'Manage system users and permissions'
      },
      {
        name: 'Team Management',
        requiredRoles: ['admin', 'manager'],
        icon: Users,
        description: 'Create and manage teams'
      },
      {
        name: 'Project Creation',
        requiredRoles: ['admin', 'manager'],
        icon: FolderPlus,
        description: 'Create and own projects'
      },
      {
        name: 'Reports Access',
        requiredRoles: ['admin', 'manager'],
        icon: Settings,
        description: 'View comprehensive reports'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Role-Based Access Control</h2>
          <p className="text-gray-600 mt-2">
            Your current role: <span className="font-semibold capitalize">{user.role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const hasAccess = hasAnyRole(feature.requiredRoles);
            const Icon = feature.icon;
            
            return (
              <Card key={feature.name} className={`p-6 ${hasAccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${hasAccess ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Icon className={`h-6 w-6 ${hasAccess ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                      {hasAccess ? (
                        <Eye className="h-5 w-5 text-green-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{feature.description}</p>
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">Required roles: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feature.requiredRoles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                              ${user.role === role ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {hasAccess ? 'Access Granted' : 'Access Denied'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Role-Based Features Demo</h1>
        <p className="text-gray-600 mt-2">
          Explore how different user roles see different features and interfaces.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8">
        <Button
          onClick={() => setActiveDemo('dashboard')}
          variant={activeDemo === 'dashboard' ? 'primary' : 'outline'}
          size="sm"
        >
          Role-Based Dashboard
        </Button>
        {hasAnyRole(['admin', 'manager']) && (
          <Button
            onClick={() => setActiveDemo('teams')}
            variant={activeDemo === 'teams' ? 'primary' : 'outline'}
            size="sm"
          >
            Team Management
          </Button>
        )}
        <Button
          onClick={() => setActiveDemo('permissions')}
          variant={activeDemo === 'permissions' ? 'primary' : 'outline'}
          size="sm"
        >
          Permissions Demo
        </Button>
        <Button
          onClick={() => setShowLoginTest(true)}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test Login
        </Button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg">
        {activeDemo === 'dashboard' && <RoleBasedDashboard />}
        {activeDemo === 'teams' && hasAnyRole(['admin', 'manager']) && <TeamManagement />}
        {activeDemo === 'permissions' && renderPermissionsDemo()}
      </div>

      {/* Login Test Modal */}
      {showLoginTest && (
        <LoginTest onClose={() => setShowLoginTest(false)} />
      )}
    </div>
  );
};
