import React, { useState } from 'react';
import { 
  Clock, 
   
  Edit2, 
  Trash2, 
  Check, 
  X,
  Calendar,
  DollarSign,
  MoreVertical
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { TimeLog } from '../../types';
import { UserAvatar } from './UserAvatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { useAuthContext } from '../../context/AuthContext';


interface TimeLogEntryProps {
  timeLog: TimeLog;
  showUser?: boolean;
  showProject?: boolean;
  showTask?: boolean;
  editable?: boolean;
  onEdit?: (timeLog: TimeLog) => void;
  onDelete?: (timeLogId: string) => void;
  onApprove?: (timeLogId: string) => void;
  onReject?: (timeLogId: string) => void;
  className?: string;
}

export const TimeLogEntry: React.FC<TimeLogEntryProps> = ({
  timeLog,
  showUser = true,
  showProject = true,
  showTask = true,
  // editable = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  className = ''
}) => {
  const { canApproveTimeLog, user } = useAuthContext();
  // const { colors } = useTheme(); // Not used currently
  
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editData, setEditData] = useState({
    description: timeLog.description,
    duration: timeLog.duration.toString(),
    date: timeLog.date,
    billable: timeLog.billable
  });

  const canEdit = user?.id === timeLog.userId || canApproveTimeLog();
  const canDelete = user?.id === timeLog.userId || canApproveTimeLog();
  const canApprove = canApproveTimeLog() && !timeLog.approved && user?.id !== timeLog.userId;

  // Format duration (hours to time string)
  const formatTimeLogDuration = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Calculate earnings if billable
  const earnings = timeLog.billable && timeLog.hourlyRate 
    ? timeLog.duration * timeLog.hourlyRate 
    : 0;

  const handleEdit = () => {
    if (onEdit) {
      const updatedTimeLog = {
        ...timeLog,
        description: editData.description,
        duration: parseFloat(editData.duration),
        date: editData.date,
        billable: editData.billable
      };
      onEdit(updatedTimeLog);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      description: timeLog.description,
      duration: timeLog.duration.toString(),
      date: timeLog.date,
      billable: timeLog.billable
    });
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(timeLog.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(timeLog.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this time log?')) {
      onDelete(timeLog.id);
    }
  };

  return (
    <Card className={`group hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-4">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">Edit Time Log</h4>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleEdit}>
                  <Check size={14} className="mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={editData.duration}
                  onChange={(e) => setEditData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`billable-${timeLog.id}`}
                checked={editData.billable}
                onChange={(e) => setEditData(prev => ({ ...prev, billable: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`billable-${timeLog.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                Billable hours
              </label>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {showUser && (
                  <UserAvatar 
                    user={timeLog.user} 
                    size="sm" 
                    showTooltip={true}
                  />
                )}
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="flex-shrink-0 text-gray-500" />
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {formatTimeLogDuration(timeLog.duration)}
                    </span>
                    
                    {timeLog.billable && (
                      <Badge color="info" size="sm">
                        Billable
                      </Badge>
                    )}
                    
                    {timeLog.approved ? (
                      <Badge color="success" size="sm">
                        Approved
                      </Badge>
                    ) : (
                      <Badge color="warning" size="sm">
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{format(parseISO(timeLog.date), 'MMM d, yyyy')}</span>
                    </div>
                    
                    {timeLog.startTime && timeLog.endTime && (
                      <div>
                        {format(parseISO(timeLog.startTime), 'HH:mm')} - {format(parseISO(timeLog.endTime), 'HH:mm')}
                      </div>
                    )}
                    
                    {earnings > 0 && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <DollarSign size={14} />
                        <span>${earnings.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {(canEdit || canDelete || canApprove) && (
                <div className="relative flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActions(!showActions)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={16} />
                  </Button>
                  
                  {showActions && (
                    <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowActions(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit2 size={14} />
                          Edit Time Log
                        </button>
                      )}
                      
                      {canApprove && (
                        <>
                          <button
                            onClick={() => {
                              handleApprove();
                              setShowActions(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => {
                              handleReject();
                              setShowActions(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </>
                      )}
                      
                      {canDelete && (
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowActions(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Project and Task info */}
            {(showProject || showTask) && (
              <div className="flex items-center gap-4 mb-3 text-sm">
                {showProject && timeLog.project && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">Project:</span>
                    <Badge color="secondary" size="sm" variant="outline">
                      {timeLog.project.name}
                    </Badge>
                  </div>
                )}
                
                {showTask && timeLog.task && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">Task:</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {timeLog.task.title}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                {timeLog.description}
              </p>
            </div>

            {/* Tags */}
            {timeLog.tags && timeLog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {timeLog.tags.map((tag) => (
                  <Badge key={tag} size="sm" variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Approval info */}
            {timeLog.approved && timeLog.approvedAt && timeLog.approvedBy && (
              <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                Approved on {format(parseISO(timeLog.approvedAt), 'MMM d, yyyy')} by {timeLog.approvedBy}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Compact time log entry for lists
interface CompactTimeLogEntryProps {
  timeLog: TimeLog;
  onClick?: (timeLog: TimeLog) => void;
  className?: string;
}

export const CompactTimeLogEntry: React.FC<CompactTimeLogEntryProps> = ({
  timeLog,
  onClick,
  className = ''
}) => {
  const formatTimeLogDuration = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={() => onClick?.(timeLog)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Clock size={16} className="text-gray-500 flex-shrink-0" />
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {formatTimeLogDuration(timeLog.duration)}
            </span>
            
            {timeLog.billable && (
              <Badge color="info" size="sm">
                Billable
              </Badge>
            )}
            
            {timeLog.approved ? (
              <Badge color="success" size="sm">
                Approved
              </Badge>
            ) : (
              <Badge color="warning" size="sm">
                Pending
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {timeLog.description}
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
        {format(parseISO(timeLog.date), 'MMM d')}
      </div>
    </div>
  );
};

// Time log summary component
interface TimeLogSummaryProps {
  timeLogs: TimeLog[];
  className?: string;
}

export const TimeLogSummary: React.FC<TimeLogSummaryProps> = ({
  timeLogs,
  className = ''
}) => {
  const totalHours = timeLogs.reduce((sum, log) => sum + log.duration, 0);
  const billableHours = timeLogs.filter(log => log.billable).reduce((sum, log) => sum + log.duration, 0);
  const approvedHours = timeLogs.filter(log => log.approved).reduce((sum, log) => sum + log.duration, 0);
  const totalEarnings = timeLogs
    .filter(log => log.billable && log.hourlyRate)
    .reduce((sum, log) => sum + (log.duration * log.hourlyRate!), 0);

  const formatTimeLogDuration = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatTimeLogDuration(totalHours)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {formatTimeLogDuration(billableHours)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Billable</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {formatTimeLogDuration(approvedHours)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          ${totalEarnings.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Earnings</div>
      </div>
    </div>
  );
};