import { useState, useEffect, useCallback } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart as RePieChart, Pie, Cell } from 'recharts'
import {
  Users,
  Clock,
  Target,
  Download,
  CheckCircle,
  TrendingUp,
  Building2,
  User,
  Calendar,
  PieChart,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Select,
  Badge,
  LoadingSpinner,
  Avatar,
} from '../components/ui'
import { reportsService } from '../services'

const timeRangeOptions = [
  { value: 'last-week', label: 'Last Week' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'last-year', label: 'Last Year' },
]

type ReportType = 'projects' | 'teams' | 'users'

interface ReportStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  completionRate: number
  overdueTasks?: number
  totalHours?: number
  billableHours?: number
}

interface ProjectReport {
  id: string
  name: string
  status: string
  priority: string
  owner: { id: string; name: string; email: string }
  progress: number
  stats: ReportStats
  createdAt: string
  updatedAt: string
}

interface TeamReport {
  id: string
  name: string
  description: string
  manager: { id: string; name: string; email: string }
  memberCount: number
  projectCount: number
  stats: ReportStats
  createdAt: string
  updatedAt: string
}

interface UserReport {
  id: string
  name: string
  email: string
  role: string
  department: string
  jobTitle: string
  projectCount: number
  stats: ReportStats
  createdAt: string
}

interface ReportSummary {
  totalProjects?: number
  activeProjects?: number
  completedProjects?: number
  avgCompletionRate?: number
  overdueProjects?: number
  onHoldProjects?: number
  totalTeams?: number
  totalMembers?: number
  totalUsers?: number
  totalTasks?: number
  totalHours?: number
  billableHours?: number
}

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<ReportType>('projects')
  const [selectedTimeRange, setSelectedTimeRange] = useState('last-month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Report data states
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([])
  const [teamReports, setTeamReports] = useState<TeamReport[]>([])
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [summary, setSummary] = useState<ReportSummary>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    avgCompletionRate: 0,
    overdueProjects: 0,
    onHoldProjects: 0,
    totalTeams: 0,
    totalMembers: 0,
    totalUsers: 0,
    totalTasks: 0,
    totalHours: 0,
    billableHours: 0,
  })

  // Fetch report data based on active tab
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = { timeRange: selectedTimeRange }

      switch (activeTab) {
        case 'projects': {
          const projectResponse = await reportsService.getProjectReports(params)
          if (projectResponse.success && projectResponse.data) {
            // The backend returns {projects: [...], summary: {...}}
            const projects = projectResponse.data.projects || []
            setProjectReports(projects)
            setSummary(prev => ({
              ...prev,
              totalProjects: projectResponse.data.summary?.totalProjects ?? prev.totalProjects,
              activeProjects: projectResponse.data.summary?.activeProjects ?? prev.activeProjects,
              completedProjects: projectResponse.data.summary?.completedProjects ?? prev.completedProjects,
              avgCompletionRate: projectResponse.data.summary?.avgCompletionRate ?? prev.avgCompletionRate,
              overdueProjects: projectResponse.data.summary?.overdueProjects ?? prev.overdueProjects,
              onHoldProjects: projectResponse.data.summary?.onHoldProjects ?? prev.onHoldProjects,
            }))
          }
          break
        }

        case 'teams': {
          const teamResponse = await reportsService.getTeamReports(params)
          if (teamResponse.success && teamResponse.data) {
            // The backend returns {teams: [...], summary: {...}}
            const teams = teamResponse.data.teams || []
            setTeamReports(teams)
            setSummary({
              totalTeams: teamResponse.data.summary?.totalTeams || teams.length,
              totalMembers: teamResponse.data.summary?.totalMembers || 0,
              avgCompletionRate: teamResponse.data.summary?.avgCompletionRate || 0,
            })
          }
          break
        }

        case 'users': {
          const userResponse = await reportsService.getUserReports(params)
          if (userResponse.success && userResponse.data) {
            setUserReports(userResponse.data.users || [])
            setSummary(prev => ({
              ...prev,
              totalUsers: userResponse.data.stats?.totalUsers ?? prev.totalUsers,
              totalTasks: userResponse.data.stats?.totalTasks ?? prev.totalTasks,
              totalHours: userResponse.data.stats?.totalHours ?? prev.totalHours,
              billableHours:
                (userResponse.data as { stats?: { billableHours?: number } } | undefined)?.stats?.billableHours ??
                prev.billableHours,
              avgCompletionRate: userResponse.data.stats?.avgCompletionRate ?? prev.avgCompletionRate,
            }))
          }
          break
        }
      }
    } catch (err) {
      setError('Failed to fetch report data')
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedTimeRange])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const handleExportReport = async () => {
    try {
      const response = await reportsService.exportReport({
        type: activeTab,
        format: 'csv',
      })

      if (response.success && response.data) {
        // In a real implementation, this would trigger a file download
        console.log('Export successful:', response.data)
        // TODO: Implement actual file download
      }
    } catch (err) {
      console.error('Error exporting report:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'success'
      case 'on_hold':
        return 'warning'
      case 'planning':
        return 'info'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'danger'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const renderSummaryCards = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalProjects || 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.activeProjects || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">On Hold</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.onHoldProjects || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.completedProjects || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Completion</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(summary.avgCompletionRate || 0)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.overdueProjects || 0}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'teams':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Teams</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalTeams || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalMembers || 0}</p>
                  </div>
                  <User className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Completion</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(summary.avgCompletionRate || 0)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'users':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{summary.totalUsers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold">{summary.totalTasks || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold">{formatHours(summary.totalHours || 0)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Completion</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(summary.avgCompletionRate || 0)}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  const renderReportTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    switch (activeTab) {
      case 'projects':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Project</th>
                  <th className="text-left py-3 px-4 font-semibold">Owner</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold">Tasks</th>
                  <th className="text-left py-3 px-4 font-semibold">Completion</th>
                  <th className="text-left py-3 px-4 font-semibold">Start</th>
                  <th className="text-left py-3 px-4 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody>
                {projectReports.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-gray-600">Progress: {project.progress}%</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          size="sm"
                          alt={project.owner.name}
                          fallback={project.owner.name.charAt(0)}
                        />
                        <span className="text-sm">{project.owner.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusColor(project.status)} size="sm">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getPriorityColor(project.priority)} size="sm">
                        {project.priority}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p>
                          {project.stats.completedTasks}/{project.stats.totalTasks} completed
                        </p>
                        <p className="text-gray-600">{project.stats.inProgressTasks} in progress</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${project.stats.completionRate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatPercentage(project.stats.completionRate || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {projectReports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-600">
                      No project data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )

      case 'teams':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Team</th>
                  <th className="text-left py-3 px-4 font-semibold">Manager</th>
                  <th className="text-left py-3 px-4 font-semibold">Members</th>
                  <th className="text-left py-3 px-4 font-semibold">Projects</th>
                  <th className="text-left py-3 px-4 font-semibold">Tasks</th>
                  <th className="text-left py-3 px-4 font-semibold">Completion</th>
                </tr>
              </thead>
              <tbody>
                {teamReports.map((team) => (
                  <tr
                    key={team.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-gray-600">{team.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          size="sm"
                          alt={team.manager?.name || 'Unknown'}
                          fallback={(team.manager?.name || 'U').charAt(0)}
                        />
                        <span className="text-sm">{team.manager?.name || 'No manager'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{team.memberCount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{team.projectCount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p>
                          {team.stats.completedTasks}/{team.stats.totalTasks} completed
                        </p>
                        <p className="text-gray-600">{team.stats.inProgressTasks} in progress</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${team.stats.completionRate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatPercentage(team.stats.completionRate || 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {teamReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-600">
                      No team data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )

      case 'users':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">User</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Department</th>
                  <th className="text-left py-3 px-4 font-semibold">Projects</th>
                  <th className="text-left py-3 px-4 font-semibold">Tasks</th>
                  <th className="text-left py-3 px-4 font-semibold">Hours</th>
                  <th className="text-left py-3 px-4 font-semibold">Completion</th>
                </tr>
              </thead>
              <tbody>
                {userReports.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar size="sm" alt={user.name} fallback={user.name.charAt(0)} />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" size="sm">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{user.department || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{user.projectCount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p>
                          {user.stats.completedTasks}/{user.stats.totalTasks} completed
                        </p>
                        <p className="text-gray-600">{user.stats.inProgressTasks} in progress</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p>{formatHours(user.stats.totalHours || 0)} total</p>
                        <p className="text-gray-600">
                          {formatHours(user.stats.billableHours || 0)} billable
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${user.stats.completionRate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatPercentage(user.stats.completionRate || 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {userReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-600">
                      No user data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )

      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchReportData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track progress and performance across projects, teams, and users
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
              activeTab === 'projects'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
              activeTab === 'teams' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
              activeTab === 'users' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Users</span>
          </button>
        </div>

        {/* Filter and Export */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="min-w-[140px]"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleExportReport}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {activeTab === 'projects' && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Project Completion</h3>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectReports.map(p => ({ name: p.name, completion: p.stats.completionRate }))}>
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="completion" fill="#3b82f6" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'teams' && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Team Task Completion</h3>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={teamReports.map(t => ({ name: t.name, completion: t.stats.completionRate }))}>
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="completion" stroke="#10b981" name="Completion %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Hours Distribution (Top 6)</h3>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={userReports.slice(0, 6).map(u => ({ name: u.name, value: u.stats.totalHours || 0 }))} dataKey="value" nameKey="name" outerRadius={100} label>
                      {userReports.slice(0, 6).map((_, i) => (
                        <Cell key={`cell-${i}`} fill={["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"][i % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}h`} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {activeTab === 'projects' && 'Project Reports'}
            {activeTab === 'teams' && 'Team Reports'}
            {activeTab === 'users' && 'User Reports'}
          </h2>
        </CardHeader>
        <CardContent className="p-0">{renderReportTable()}</CardContent>
      </Card>
    </div>
  )
}

export default ReportsPage
