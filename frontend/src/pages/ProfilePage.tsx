import { useState, useEffect } from 'react';
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
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

// Initial user state (will be filled from API)
const initialUserState = {
  name: '',
  email: '',
  phone: '',
  location: '',
  jobTitle: '',
  department: '',
  bio: '',
  language: 'en',
  theme: 'light'
};

const mockStats = {
  projectsManaged: 12,
  tasksCompleted: 847,
  teamMembers: 25,
  hoursLogged: 1420
};

// Removed mock recent activity; using live data from API

// Removed timezone options as preferences are language + theme only

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
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [formData, setFormData] = useState(initialUserState);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; description: string; createdAt: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await authService.getCurrentUser();
        if (me.success && me.data) {
          const u: any = me.data;
          setFormData(prev => ({
            ...prev,
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            location: u.location || '',
            jobTitle: u.jobTitle || '',
            department: u.department || '',
            bio: u.bio || '',
            language: u.preferences?.language || 'en',
            theme: u.preferences?.theme || 'light',
          }));
        }
      } catch {}
      try {
        const act = await userService.getMyActivity(10);
        if (act.success && act.data) {
          setRecentActivity(act.data.activities.map((a: any) => ({ id: a.id, description: a.description, createdAt: a.createdAt })));
        }
      } catch {}
    };
    load();
  }, []);

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
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Error updating profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
        toast.error('Please fill in all password fields');
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        toast.error('New passwords do not match');
        return;
      }
      const response = await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (response.success) {
        toast.success('Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      } else {
        toast.error(response.message || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Error updating password');
    }
  };

  // Activity icon helper not required; using a generic icon

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
                  <Avatar size="xl" alt={formData.name} src={''} />
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">{formData.name}</h2>
                <p className="text-gray-500">{formData.jobTitle}</p>
                <p className="text-sm text-gray-400">{formData.department}</p>
                
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formData.email}
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
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Input
                      label="Confirm New Password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                    />
                    <Button onClick={handleChangePassword}>Update Password</Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2FA removed */}
            </div>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader title="Application Preferences" />
              <CardContent>
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader title="Recent Activity" />
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg">📝</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{a.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(a.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};