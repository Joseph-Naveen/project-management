import { useState, useEffect } from 'react';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { Button, Input, Select } from '../ui';
import type { User } from '../../types/models';

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField = ({ label, error, required, children }: FormFieldProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
);

export const UserForm = ({ user, onSuccess, onCancel }: UserFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'developer' as 'admin' | 'manager' | 'developer' | 'qa',
    department: '',
    jobTitle: '',
    phone: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: (user.role === 'owner' || user.role === 'member') ? 'developer' : user.role as 'admin' | 'manager' | 'developer' | 'qa',
        department: user.department || '',
        jobTitle: user.jobTitle || '',
        phone: user.phone || '',
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (user) {
        // Update existing user
        const updateData: {
          name: string;
          email: string;
          role: 'admin' | 'manager' | 'developer' | 'qa';
          department?: string;
          jobTitle?: string;
          phone?: string;
          isActive?: boolean;
        } = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || undefined,
          jobTitle: formData.jobTitle || undefined,
          phone: formData.phone || undefined,
          isActive: formData.isActive,
        };

        await updateUserMutation.mutateAsync({
          id: user.id,
          data: updateData,
        });
      } else {
        // Create new user - backend will use email as password
        const createData: {
          name: string;
          email: string;
          role?: 'admin' | 'manager' | 'developer' | 'qa';
          department?: string;
          jobTitle?: string;
          phone?: string;
        } = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        // Add optional fields if provided
        if (formData.department) {
          createData.department = formData.department;
        }
        if (formData.jobTitle) {
          createData.jobTitle = formData.jobTitle;
        }
        if (formData.phone) {
          createData.phone = formData.phone;
        }

        await createUserMutation.mutateAsync(createData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ general: 'Failed to save user. Please try again.' });
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Name"
          error={errors.name}
          required
        >
          <Input
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder="Enter full name"
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Email"
          error={errors.email}
          required
        >
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="Enter email address"
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Role"
          error={errors.role}
          required
        >
          <Select
            value={formData.role}
            onChange={handleChange('role')}
            disabled={isLoading}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="developer">Developer</option>
            <option value="qa">QA</option>
          </Select>
        </FormField>

        <FormField
          label="Department"
          error={errors.department}
        >
          <Input
            type="text"
            value={formData.department}
            onChange={handleChange('department')}
            placeholder="Enter department"
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Job Title"
          error={errors.jobTitle}
        >
          <Input
            type="text"
            value={formData.jobTitle}
            onChange={handleChange('jobTitle')}
            placeholder="Enter job title"
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Phone"
          error={errors.phone}
        >
          <Input
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder="Enter phone number"
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Status"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange('isActive')}
              disabled={isLoading}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active User
            </label>
          </div>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};
