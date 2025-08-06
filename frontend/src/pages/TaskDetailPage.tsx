import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useProgressUpdates } from '../hooks/useProgressUpdates';
import { 
  ArrowLeft,
  Edit3,
  Clock,
  MessageSquare,
  Plus,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Badge, 
  Avatar, 
  Button,
  Input,
  Textarea,
  Modal,
  Select,
  LoadingSpinner
} from '../components/ui';
import { ROUTES } from '../constants';
import { taskService, commentService, timeTrackingService, socketService } from '../services';
import type { Task, Comment, TimeLog } from '../types';

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const { onTaskStatusChange } = useProgressUpdates();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showAddTimeLogForm, setShowAddTimeLogForm] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [newTimeLogText, setNewTimeLogText] = useState('');
  const [newTimeLogDuration, setNewTimeLogDuration] = useState('');
  const [newTimeLogDate, setNewTimeLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingTimeLog, setEditingTimeLog] = useState<string | null>(null);
  const [editTimeLogText, setEditTimeLogText] = useState('');
  const [editTimeLogDuration, setEditTimeLogDuration] = useState('');
  const [editTimeLogDate, setEditTimeLogDate] = useState('');

  const fetchTaskData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch task details
      const taskResponse = await taskService.getTaskById(id!);
      if (taskResponse.success && taskResponse.data) {
        setTask(taskResponse.data);
      }

      // Fetch task comments
      const commentsResponse = await commentService.getComments({ taskId: id });
      if (commentsResponse.success && commentsResponse.data) {
        setComments(commentsResponse.data.comments);
      }

      // Fetch task time logs
      const timeLogsResponse = await timeTrackingService.getTimeLogs({ taskId: id });
      if (timeLogsResponse.success && timeLogsResponse.data) {
        setTimeLogs(timeLogsResponse.data.timeLogs);
      }

    } catch (err) {
      console.error('Error fetching task data:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Invalid time value')) {
          setError('Task data contains invalid date information');
        } else if (err.message.includes('404')) {
          setError('Task not found');
        } else if (err.message.includes('403')) {
          setError('You do not have permission to view this task');
        } else {
          setError(`Failed to fetch task data: ${err.message}`);
        }
      } else {
        setError('Failed to fetch task data');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch task data on component mount
  useEffect(() => {
    if (id) {
      fetchTaskData();
    }
  }, [id, fetchTaskData]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!id) return;

    // Connect to socket if not already connected
    if (!socketService.isSocketConnected()) {
      socketService.connect().catch(console.error);
    }

    // Join task room for real-time updates
    socketService.joinRoom(`task:${id}`);

    // Subscribe to task update events
    const unsubscribeTaskUpdate = socketService.subscribe('task:update', (data) => {
      if (data.taskId === id) {
        setTask(data.task as Task);
      }
    });

    // Subscribe to comment events
    const unsubscribeCommentNew = socketService.subscribe('comment:new', (data) => {
      if (data.taskId === id) {
        setComments(prev => [...prev, data.comment as Comment]);
      }
    });

    const unsubscribeCommentUpdate = socketService.subscribe('comment:update', (data) => {
      if (data.taskId === id) {
        setComments(prev => prev.map(comment => 
          comment.id === data.commentId ? data.comment as Comment : comment
        ));
      }
    });

    const unsubscribeCommentDelete = socketService.subscribe('comment:delete', (data) => {
      setComments(prev => prev.filter(comment => comment.id !== data.commentId));
    });

    // Cleanup function
    return () => {
      socketService.leaveRoom(`task:${id}`);
      unsubscribeTaskUpdate();
      unsubscribeCommentNew();
      unsubscribeCommentUpdate();
      unsubscribeCommentDelete();
    };
  }, [id, fetchTaskData]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;

    try {
      const response = await commentService.createComment({
        content: newComment,
        taskId: id
      });

      if (response.success && response.data) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        setShowCommentModal(false);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await commentService.updateComment(commentId, {
        content: editCommentText
      });

      if (response.success && response.data) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? { ...comment, content: editCommentText, isEdited: true } : comment
        ));
        setEditingComment(null);
        setEditCommentText('');
      }
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await commentService.deleteComment(commentId);

      if (response.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // Time Log Management Functions
  const handleAddTimeLog = async () => {
    if (!newTimeLogText.trim() || !newTimeLogDuration.trim() || !task) return;

    try {
      const response = await timeTrackingService.createTimeLog({
        description: newTimeLogText.trim(),
        duration: parseFloat(newTimeLogDuration),
        date: newTimeLogDate,
        taskId: task.id,
        projectId: task.projectId,
        userId: user?.id || '' // Assuming you have user context
      });

      if (response.success && response.data) {
        setTimeLogs(prev => [response.data, ...prev]);
        setNewTimeLogText('');
        setNewTimeLogDuration('');
        setNewTimeLogDate(new Date().toISOString().split('T')[0]);
        // Auto-close the form after successful submission
        setShowAddTimeLogForm(false);
      }
    } catch (err) {
      console.error('Error adding time log:', err);
    }
  };

  const handleEditTimeLog = async (timeLogId: string) => {
    if (!editTimeLogText.trim() || !editTimeLogDuration.trim()) return;

    try {
      const response = await timeTrackingService.updateTimeLog(timeLogId, {
        description: editTimeLogText.trim(),
        hours: parseFloat(editTimeLogDuration),
        logDate: editTimeLogDate
      });

      if (response.success && response.data) {
        setTimeLogs(prev => prev.map(log => 
          log.id === timeLogId ? response.data : log
        ));
        setEditingTimeLog(null);
        setEditTimeLogText('');
        setEditTimeLogDuration('');
        setEditTimeLogDate('');
      }
    } catch (err) {
      console.error('Error updating time log:', err);
    }
  };

  const handleDeleteTimeLog = async (timeLogId: string) => {
    if (!window.confirm('Are you sure you want to delete this time log?')) return;

    try {
      const response = await timeTrackingService.deleteTimeLog(timeLogId);
      if (response.success) {
        setTimeLogs(prev => prev.filter(log => log.id !== timeLogId));
      }
    } catch (err) {
      console.error('Error deleting time log:', err);
    }
  };

  const startEditTimeLog = (timeLog: TimeLog) => {
    setEditingTimeLog(timeLog.id);
    setEditTimeLogText(timeLog.description);
    setEditTimeLogDuration(timeLog.duration?.toString() || '');
    setEditTimeLogDate(timeLog.date);
  };

  const cancelEditTimeLog = () => {
    setEditingTimeLog(null);
    setEditTimeLogText('');
    setEditTimeLogDuration('');
    setEditTimeLogDate('');
  };

  const handleUpdateTask = async (updatedData: Partial<Task>) => {
    if (!task) return;

    try {
      // Convert dependencies from TaskDependency[] to string[] if needed
      const requestData = {
        ...updatedData,
        dependencies: updatedData.dependencies?.map(dep => 
          typeof dep === 'string' ? dep : dep.task.id
        )
      };
      
      const response = await taskService.updateTask(task.id, requestData);
      if (response.success && response.data) {
        const updatedTask = response.data;
        setTask(updatedTask);
        setShowEditModal(false);
        
        // If status was updated, trigger progress bar updates
        if (updatedData.status && updatedData.status !== task.status && task.projectId) {
          await onTaskStatusChange(task.id, task.projectId, updatedData.status);
        }
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'review':
        return 'info';
      case 'todo':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'review':
        return <AlertTriangle className="w-4 h-4" />;
      case 'todo':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Task not found'}</p>
          <Button onClick={fetchTaskData}>Retry</Button>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining(task.dueDate || '');
  const totalLoggedHours = timeLogs.reduce((total, log) => total + (log.duration || 0), 0);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { key: 'time-logs', label: 'Time Logs', icon: Clock, count: timeLogs.length }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.TASKS} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">#{task.id}</span>
              <Badge variant="secondary" size="sm">{task.project?.name || 'No Project'}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowEditModal(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Task Status Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(task.status)}
              <Badge variant={getStatusColor(task.status)}>
                {task.status?.replace('_', ' ') || 'No Status'}
              </Badge>
              <Badge variant={getPriorityColor(task.priority)}>
                {task.priority || 'No Priority'}
              </Badge>
              {task.dueDate && (
                <span className={`text-sm ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                  Due: {formatDate(task.dueDate)}
                  {daysRemaining < 0 && ' (Overdue)'}
                  {daysRemaining >= 0 && daysRemaining < 3 && ` (${daysRemaining} days left)`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Estimated: {formatTime(task.estimatedHours || 0)}</span>
              <span>Logged: {formatTime(totalLoggedHours)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" size="sm">{tab.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Description</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </CardContent>
            </Card>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Tags</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Task Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <p className="text-gray-900">{formatDate(task.createdAt)}</p>
                </div>
                {task.dueDate && (
                  <div>
                    <span className="text-sm text-gray-600">Due Date</span>
                    <p className="text-gray-900">{formatDate(task.dueDate)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Estimated Hours</span>
                  <p className="text-gray-900">{formatTime(task.estimatedHours || 0)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Logged Hours</span>
                  <p className="text-gray-900">{formatTime(totalLoggedHours)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Progress</span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((totalLoggedHours / (task.estimatedHours || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((totalLoggedHours / (task.estimatedHours || 1)) * 100)}% complete
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assignee */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Assignee</h3>
              </CardHeader>
              <CardContent>
                {task.assignee ? (
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" alt={task.assignee.name} src={task.assignee.avatar} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.assignee.name}</p>
                      <p className="text-xs text-gray-500">{task.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unassigned</p>
                )}
              </CardContent>
            </Card>

            {/* Reporter */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Reporter</h3>
              </CardHeader>
              <CardContent>
                {task.creator ? (
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" alt={task.creator.name} src={task.creator.avatar} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.creator.name}</p>
                      <p className="text-xs text-gray-500">{task.creator.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No reporter assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Watchers */}
            {task.watchers && task.watchers.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Watchers</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.watchers.map((watcher) => (
                      <div key={watcher} className="flex items-center gap-2">
                        <Avatar size="sm" alt="Watcher" />
                        <span className="text-sm text-gray-700">{watcher}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Comments</h3>
              <Button onClick={() => setShowCommentModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <Avatar size="sm" alt={comment.author.name} src={comment.author.avatar} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditComment(comment)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit comment"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              <Check size={12} />
                              Save
                            </button>
                            <button
                              onClick={cancelEditComment}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700">{comment.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">No comments yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Logs Tab */}
      {activeTab === 'time-logs' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Time Logs</h3>
              <Button onClick={() => setShowAddTimeLogForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Time Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Time Log Form */}
            {showAddTimeLogForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium mb-3">Add New Time Log</h4>
                <div className="space-y-3">
                  <div>
                    <Input
                      label="Description"
                      value={newTimeLogText}
                      onChange={(e) => setNewTimeLogText(e.target.value)}
                      placeholder="What did you work on?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        label="Duration (hours)"
                        type="number"
                        step="0.25"
                        value={newTimeLogDuration}
                        onChange={(e) => setNewTimeLogDuration(e.target.value)}
                        placeholder="2.5"
                      />
                    </div>
                    <div>
                      <Input
                        label="Date"
                        type="date"
                        value={newTimeLogDate}
                        onChange={(e) => setNewTimeLogDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTimeLog} size="sm">
                      <Send size={16} />
                      Add Time Log
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddTimeLogForm(false);
                        setNewTimeLogText('');
                        setNewTimeLogDuration('');
                        setNewTimeLogDate(new Date().toISOString().split('T')[0]);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {timeLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    {editingTimeLog === log.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editTimeLogText}
                          onChange={(e) => setEditTimeLogText(e.target.value)}
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            step="0.25"
                            value={editTimeLogDuration}
                            onChange={(e) => setEditTimeLogDuration(e.target.value)}
                            placeholder="Duration (hours)"
                          />
                          <Input
                            type="date"
                            value={editTimeLogDate}
                            onChange={(e) => setEditTimeLogDate(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTimeLog(log.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            <Check size={12} />
                            Save
                          </button>
                          <button
                            onClick={cancelEditTimeLog}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900">{log.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-500">{formatDate(log.date)}</p>
                          <p className="text-xs font-medium text-blue-600">
                            {formatTime(log.duration || 0)}
                          </p>
                          {log.user && (
                            <p className="text-xs text-gray-500">by {log.user.name}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Time Log Actions */}
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => startEditTimeLog(log)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit time log"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTimeLog(log.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete time log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {timeLogs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No time logs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={task.description || ''}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value as 'todo' | 'in_progress' | 'review' | 'done' })}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </Select>
            <Select
              label="Priority"
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>
          <Input
            label="Due Date"
            type="date"
            value={task.dueDate || ''}
            onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
          />
          <Input
            label="Estimated Hours"
            type="number"
            value={task.estimatedHours?.toString() || ''}
            onChange={(e) => setTask({ ...task, estimatedHours: parseFloat(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateTask(task)}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        title="Add Comment"
      >
        <div className="space-y-4">
          <Textarea
            label="Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            placeholder="Write your comment..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCommentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment}>
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};