import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
   
  Tag, 
  CheckSquare,
  AlertCircle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { useDebounce } from '../../hooks';

// Filter interfaces
interface BaseFilter {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  labels?: string[];
  projectId?: string;
  role?: string;
  department?: string;
  overdue?: boolean;
}

interface ProjectFilter extends BaseFilter {
  type: 'project';
  budget?: {
    min?: number;
    max?: number;
  };
  progress?: {
    min?: number;
    max?: number;
  };
}

interface TaskFilter extends BaseFilter {
  type: 'task';
  projectId?: string;
  overdue?: boolean;
  labels?: string[];
}

interface UserFilter extends BaseFilter {
  type: 'user';
  role?: string;
  department?: string;
  isActive?: boolean;
}

type FilterType = ProjectFilter | TaskFilter | UserFilter;

interface SearchFilterProps<T extends FilterType> {
  filters: T;
  onFiltersChange: (filters: T) => void;
  onClear?: () => void;
  options?: {
    users?: Array<{ id: string; name: string; avatar?: string }>;
    projects?: Array<{ id: string; name: string }>;
    tags?: string[];
    labels?: string[];
    departments?: string[];
  };
  placeholder?: string;
  showAdvanced?: boolean;
  className?: string;
}

export const SearchFilter = <T extends FilterType>({
  filters,
  onFiltersChange,
  onClear,
  options = {},
  placeholder = "Search...",
  showAdvanced = true,
  className = ''
}: SearchFilterProps<T>) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  
  // Debounce search input
  const debouncedSearch = useDebounce(searchValue, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({
        ...filters,
        search: debouncedSearch || undefined
      } as T);
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  // Status options based on filter type
  const getStatusOptions = () => {
    switch (filters.type) {
      case 'project':
        return [
          { value: '', label: 'All Status' },
          { value: 'planning', label: 'Planning' },
          { value: 'active', label: 'Active' },
          { value: 'on_hold', label: 'On Hold' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'task':
        return [
          { value: '', label: 'All Status' },
          { value: 'todo', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'review', label: 'Review' },
          { value: 'done', label: 'Done' }
        ];
      case 'user':
        return [
          { value: '', label: 'All Users' },
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ];
      default:
        return [];
    }
  };

  // Priority options
  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Role options for user filter
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'team_member', label: 'Team Member' },
    { value: 'viewer', label: 'Viewer' }
  ];

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.assigneeId) count++;
    if (filters.creatorId) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    
    // Type-specific filters
    if (filters.type === 'task') {
      const taskFilters = filters as TaskFilter;
      if (taskFilters.projectId) count++;
      if (taskFilters.overdue) count++;
      if (taskFilters.labels && taskFilters.labels.length > 0) count++;
    }
    
    if (filters.type === 'user') {
      const userFilters = filters as UserFilter;
      if (userFilters.role) count++;
      if (userFilters.department) count++;
      if (userFilters.isActive !== undefined) count++;
    }
    
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const updateFilter = (key: keyof T, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    } as T);
  };

  const updateDateRange = (field: 'start' | 'end', value: string) => {
    const currentRange = filters.dateRange || {};
    updateFilter('dateRange', {
      ...currentRange,
      [field]: value || undefined
    });
  };

  const clearFilters = () => {
    const clearedFilters = {
      type: filters.type
    } as T;
    
    onFiltersChange(clearedFilters);
    setSearchValue('');
    
    if (onClear) {
      onClear();
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = filters.tags || [];
    updateFilter('tags', currentTags.filter(t => t !== tag));
  };

  const removeLabel = (label: string) => {
    if (filters.type === 'task') {
      const taskFilters = filters as TaskFilter;
      const currentLabels = taskFilters.labels || [];
      updateFilter('labels', currentLabels.filter(l => l !== label));
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Search and basic filters */}
        <div className="flex items-center gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={placeholder}
              className="pl-10"
            />
          </div>

          {/* Status filter */}
          <Select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-40"
          >
            {getStatusOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {/* Priority filter (not for user type) */}
          {filters.type !== 'user' && (
            <Select
              value={filters.priority || ''}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="w-36"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}

          {/* Advanced filters toggle */}
          {showAdvanced && (
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="relative"
            >
              <Filter size={16} className="mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  color="info" 
                  size="sm" 
                  className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown 
                size={14} 
                className={`ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} 
              />
            </Button>
          )}

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearFilters}>
              <X size={16} className="mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Active filter tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Search size={12} />
                Search: {filters.search}
                <button
                  onClick={() => {
                    setSearchValue('');
                    updateFilter('search', '');
                  }}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}

            {filters.status && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckSquare size={12} />
                Status: {filters.status}
                <button
                  onClick={() => updateFilter('status', '')}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}

            {filters.priority && (
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertCircle size={12} />
                Priority: {filters.priority}
                <button
                  onClick={() => updateFilter('priority', '')}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}

            {filters.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="flex items-center gap-1">
                <Tag size={12} />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}

            {filters.type === 'task' && (filters as TaskFilter).labels?.map(label => (
              <Badge key={label} variant="outline" className="flex items-center gap-1">
                <Tag size={12} />
                {label}
                <button
                  onClick={() => removeLabel(label)}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Advanced filters */}
        {showAdvanced && showAdvancedFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Filter size={16} />
              Advanced Filters
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Assignee filter */}
              {options.users && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee
                  </label>
                  <Select
                    value={filters.assigneeId || ''}
                    onChange={(e) => updateFilter('assigneeId', e.target.value)}
                  >
                    <option value="">All Assignees</option>
                    {options.users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Creator filter */}
              {options.users && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Creator
                  </label>
                  <Select
                    value={filters.creatorId || ''}
                    onChange={(e) => updateFilter('creatorId', e.target.value)}
                  >
                    <option value="">All Creators</option>
                    {options.users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Project filter (for tasks) */}
              {filters.type === 'task' && options.projects && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project
                  </label>
                  <Select
                    value={(filters as TaskFilter).projectId || ''}
                    onChange={(e) => updateFilter('projectId', e.target.value)}
                  >
                    <option value="">All Projects</option>
                    {options.projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Role filter (for users) */}
              {filters.type === 'user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <Select
                    value={(filters as UserFilter).role || ''}
                    onChange={(e) => updateFilter('role', e.target.value)}
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Department filter (for users) */}
              {filters.type === 'user' && options.departments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <Select
                    value={(filters as UserFilter).department || ''}
                    onChange={(e) => updateFilter('department', e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {options.departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Date range filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => updateDateRange('start', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => updateDateRange('end', e.target.value)}
                />
              </div>
            </div>

            {/* Special filters */}
            <div className="space-y-2">
              {/* Overdue filter (for tasks) */}
              {filters.type === 'task' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(filters as TaskFilter).overdue || false}
                    onChange={(e) => updateFilter('overdue', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Clock size={16} className="text-red-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show only overdue tasks
                  </span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Preset filter buttons component
interface FilterPresetsProps<T extends FilterType> {
  type: T['type'];
  onApplyPreset: (filters: Partial<T>) => void;
  className?: string;
}

export const FilterPresets = <T extends FilterType>({
  type,
  onApplyPreset,
  className = ''
}: FilterPresetsProps<T>) => {
  const getPresets = () => {
    switch (type) {
      case 'project':
        return [
          { label: 'Active Projects', filters: { status: 'active' } },
          { label: 'High Priority', filters: { priority: 'high' } },
          { label: 'Overdue', filters: { status: 'active' } }, // Would need custom logic
          { label: 'My Projects', filters: {} }, // Would need current user ID
        ];
      case 'task':
        return [
          { label: 'My Tasks', filters: {} }, // Would need current user ID
          { label: 'In Progress', filters: { status: 'in_progress' } },
          { label: 'High Priority', filters: { priority: 'high' } },
          { label: 'Overdue', filters: { overdue: true } },
          { label: 'This Week', filters: {} }, // Would need date logic
        ];
      case 'user':
        return [
          { label: 'Active Users', filters: { isActive: true } },
          { label: 'Admins', filters: { role: 'admin' } },
          { label: 'Project Managers', filters: { role: 'project_manager' } },
          { label: 'Team Members', filters: { role: 'team_member' } },
        ];
      default:
        return [];
    }
  };

  const presets = getPresets();

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onApplyPreset(preset.filters as Partial<T>)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
};