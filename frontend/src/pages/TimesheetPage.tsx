import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, User, FileText, Filter, Search, Download } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Input, 
  Select, 
  LoadingSpinner,
  Badge 
} from '../components/ui';
import { useTimeLogs } from '../hooks/useTimeLogs';
import { useAuthContext } from '../context/AuthContext';
import type { TimeLog } from '../types';

// Helper function to format duration (expects hours)
const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
};

// Helper function to get status color
const getStatusColor = (approved?: boolean, billable?: boolean): string => {
  if (approved === true) return 'bg-green-100 text-green-800 ';
  if (approved === false) return 'bg-red-100 text-red-800 ';
  if (billable) return 'bg-blue-100 text-blue-800 ';
  return 'bg-gray-100 text-gray-800 ';
};

// TimeLog Row Component
interface TimeLogRowProps {
  timeLog: TimeLog;
}

const TimeLogRow = ({ timeLog }: TimeLogRowProps) => {
  return (
    <div className="p-4 border border-gray-200  rounded-lg bg-white  hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* User and Task Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900 ">
                {timeLog.user?.name || 'Unknown User'}
              </span>
            </div>
            <div className="hidden sm:block text-gray-300 ">•</div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 ">
                {timeLog.task?.title || 'No Task'}
              </span>
            </div>
          </div>

          {/* Date and Duration */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 ">
                {format(new Date(timeLog.date), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="hidden sm:block text-gray-300 ">•</div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 ">
                {formatDuration(timeLog.duration)}
              </span>
            </div>
          </div>

          {/* Description */}
          {timeLog.description && (
            <p className="text-sm text-gray-600  line-clamp-2">
              {timeLog.description}
            </p>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {timeLog.billable && (
            <Badge className="bg-blue-100 text-blue-800 ">
              Billable
            </Badge>
          )}
          {timeLog.approved !== undefined && (
            <Badge className={getStatusColor(timeLog.approved, timeLog.billable)}>
              {timeLog.approved ? 'Approved' : 'Pending'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export const TimesheetPage = () => {
  const { user } = useAuthContext();
  const [filters, setFilters] = useState({
    search: '',
    userId: '',
    approved: '',
    billable: '',
    dateRange: { start: '', end: '' },
  });

  // Determine if user can see all logs (admin/manager) or just their own
  const canViewAllLogs = user?.role === 'admin' || user?.role === 'manager';
  const queryParams = {
    ...filters,
    userId: canViewAllLogs ? (filters.userId || undefined) : user?.id,
    approved: filters.approved ? filters.approved === 'true' : undefined,
    billable: filters.billable ? filters.billable === 'true' : undefined,
    dateRange: filters.dateRange.start && filters.dateRange.end ? filters.dateRange : undefined,
    limit: 50, // Show more entries on timesheet page
  };

  const { data, isLoading, error } = useTimeLogs(queryParams);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value,
      },
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      userId: '',
      approved: '',
      billable: '',
      dateRange: { start: '', end: '' },
    });
  };

  // Calculate totals
  const timeLogs = data?.timeLogs || [];
  const totalDuration = timeLogs.reduce((sum, log) => sum + log.duration, 0);
  const totalBillable = timeLogs.filter(log => log.billable).reduce((sum, log) => sum + log.duration, 0);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading time logs. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Logs</h1>
          <p className="text-gray-600 mt-2">
            {canViewAllLogs 
              ? 'View and manage all team time logs' 
              : 'Track your time and manage your work hours'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 ">
                  Total Time
                </p>
                <p className="text-2xl font-bold text-gray-900 ">
                  {formatDuration(totalDuration)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 ">
                  Billable Time
                </p>
                <p className="text-2xl font-bold text-gray-900 ">
                  {formatDuration(totalBillable)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 ">
                  Total Entries
                </p>
                <p className="text-2xl font-bold text-gray-900 ">
                  {data?.total || 0}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h2>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">
                Status
              </label>
              <Select
                value={filters.approved}
                onChange={(e) => handleFilterChange('approved', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">
                Type
              </label>
              <Select
                value={filters.billable}
                onChange={(e) => handleFilterChange('billable', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="true">Billable</option>
                <option value="false">Non-billable</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700  mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Logs List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Time Entries ({data?.total || 0})
          </h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : timeLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900  mb-2">
                No time logs found
              </h3>
              <p className="text-gray-600 ">
                {canViewAllLogs 
                  ? 'No time logs match your current filters.'
                  : 'Start tracking your time to see entries here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeLogs.map((timeLog) => (
                <TimeLogRow key={timeLog.id} timeLog={timeLog} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
