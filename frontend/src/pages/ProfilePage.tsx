import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Camera,
  Save,
  Eye,
  EyeOff,
  Shield,
  Palette
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Input,
  Textarea,
  Badge,
  Avatar,
  Select
} from '../components/ui';
import { userService } from '../services/userService';

// Mock user data - in real app this would come from API
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@company.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  jobTitle: 'Senior Project Manager',
  department: 'Engineering',
  joinDate: '2023-01-15',
  bio: 'Experienced project manager with over 8 years in software development. Passionate about agile methodologies and team collaboration.',
  avatar: '',
  timezone: 'America/Los_Angeles',
  language: 'en',
  theme: 'light'
};

const mockStats = {
  projectsManaged: 12,
  tasksCompleted: 847,
  teamMembers: 25,
  hoursLogged: 1420
};

const mockRecentActivity = [
  { id: '1', action: 'Completed task "User Authentication"', date: '2024-01-30', type: 'task' },
  { id: '2', action: 'Created project "Mobile App v2.0"', date: '2024-01-28', type: 'project' },
  { id: '3', action: 'Joined team "Frontend Development"', date: '2024-01-25', type: 'team' },
  { id: '4', action: 'Updated profile information', date: '2024-01-22', type: 'profile' }
];

const timezoneOptions = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'UTC', label: 'UTC' }
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' }
];

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'activity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    location: mockUser.location,
    jobTitle: mockUser.jobTitle,
    department: mockUser.department,
    bio: mockUser.bio,
    timezone: mockUser.timezone,
    language: mockUser.language,
    theme: mockUser.theme
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Call the user service to update the profile
      const response = await userService.updateProfile(formData);
      if (response.success) {
        setIsEditing(false);
        // You could add a success notification here
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile:', response.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return '✅';
      case 'project': return '📁';
      case 'team': return '👥';
      case 'profile': return '👤';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar size="xl" alt={mockUser.name} src={mockUser.avatar} />
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">{mockUser.name}</h2>
                <p className="text-gray-500">{mockUser.jobTitle}</p>
                <p className="text-sm text-gray-400">{mockUser.department}</p>
                
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Joined {new Date(mockUser.joinDate).toLocaleDateString()}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{mockStats.projectsManaged}</p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{mockStats.tasksCompleted}</p>
                  <p className="text-xs text-gray-500">Tasks</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{mockStats.teamMembers}</p>
                  <p className="text-xs text-gray-500">Team Members</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{mockStats.hoursLogged}</p>
                  <p className="text-xs text-gray-500">Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'profile', label: 'Profile', icon: User },
                { key: 'security', label: 'Security', icon: Shield },
                { key: 'preferences', label: 'Preferences', icon: Palette },
                { key: 'activity', label: 'Activity', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader title="Personal Information">
                <Button
                  variant={isEditing ? "primary" : "outline"}
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    'Edit Profile'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                  <Input
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="mt-6">
                  <Textarea
                    label="Bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Change Password" />
                <CardContent>
                  <div className="space-y-4 max-w-md">
                    <Input
                      label="Current Password"
                      type={showPassword ? 'text' : 'password'}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    <Input
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <Input
                      label="Confirm New Password"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <Button>Update Password</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Two-Factor Authentication" />
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">SMS Authentication</h4>
                      <p className="text-sm text-gray-500">Receive codes via SMS to your phone</p>
                    </div>
                    <Badge variant="secondary">Disabled</Badge>
                  </div>
                  <Button variant="outline" className="mt-4">
                    Enable 2FA
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader title="Application Preferences" />
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Timezone"
                      options={timezoneOptions}
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                    />
                    <Select
                      label="Language"
                      options={languageOptions}
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                    />
                  </div>
                  
                  <Select
                    label="Theme"
                    options={themeOptions}
                    value={formData.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                  />

                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Notifications</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                        { key: 'task_updates', label: 'Task Updates', description: 'Get notified when tasks are updated' },
                        { key: 'project_invites', label: 'Project Invitations', description: 'Receive invitations to new projects' },
                        { key: 'weekly_summary', label: 'Weekly Summary', description: 'Get weekly progress summaries' }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{setting.label}</h5>
                            <p className="text-sm text-gray-500">{setting.description}</p>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              defaultChecked
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader title="Recent Activity" />
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline">Load More Activity</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};