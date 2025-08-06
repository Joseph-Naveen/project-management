import React, { useState } from 'react';
import { User as UserIcon, Crown, Shield } from 'lucide-react';
import type { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  showStatus?: boolean;
  showRole?: boolean;
  clickable?: boolean;
  onClick?: (user: User) => void;
  className?: string;
}

interface TooltipProps {
  user: User;
  showRole?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const UserTooltip: React.FC<TooltipProps> = ({ 
  user, 
  showRole = true, 
  position = 'top' 
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={12} className="text-yellow-500" />;
      case 'project_manager':
        return <Shield size={12} className="text-blue-500" />;
      case 'team_member':
        return <UserIcon size={12} className="text-green-500" />;
      case 'viewer':
        return <UserIcon size={12} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'warning';
      case 'project_manager':
        return 'info';
      case 'team_member':
        return 'success';
      case 'viewer':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'project_manager':
        return 'Project Manager';
      case 'team_member':
        return 'Team Member';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900 dark:border-b-gray-700',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900 dark:border-l-gray-700',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900 dark:border-r-gray-700'
  };

  return (
    <div className={`absolute z-50 ${positionClasses[position]}`}>
      <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg p-3 shadow-lg max-w-xs">
        {/* Arrow */}
        <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-medium truncate">{user.name}</div>
            <div className="text-xs text-gray-300 truncate">{user.email}</div>
          </div>
        </div>

        {/* Role */}
        {showRole && (
          <div className="flex items-center gap-1 mb-2">
            {getRoleIcon(user.role)}
            <Badge 
              color={getRoleColor(user.role)} 
              size="sm"
              className="text-xs"
            >
              {getRoleDisplayName(user.role)}
            </Badge>
          </div>
        )}

        {/* Additional info */}
        <div className="space-y-1 text-xs text-gray-300">
          {user.department && (
            <div>Department: {user.department}</div>
          )}
          {user.jobTitle && (
            <div>Title: {user.jobTitle}</div>
          )}
          {user.phone && (
            <div>Phone: {user.phone}</div>
          )}
        </div>

        {/* Online status */}
        {user.isOnline !== undefined && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-700">
            <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-xs">{user.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showTooltip = true,
  showStatus = false,
  showRole = false,
  clickable = false,
  onClick,
  className = ''
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (!showTooltip) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Determine best position for tooltip
    let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
    
    if (rect.top < 100) {
      position = 'bottom';
    } else if (rect.bottom > viewportHeight - 100) {
      position = 'top';
    } else if (rect.left < 200) {
      position = 'right';
    } else if (rect.right > viewportWidth - 200) {
      position = 'left';
    }
    
    setTooltipPosition(position);
    setShowTooltipState(true);
  };

  const handleMouseLeave = () => {
    setShowTooltipState(false);
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(user);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={12} className="text-yellow-500" />;
      case 'project_manager':
        return <Shield size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  // Size mappings for status indicator
  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4'
  };

  // Size mappings for role icon container
  const roleIconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <div 
      className={`relative inline-block ${clickable ? 'cursor-pointer' : ''} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="relative">
        <Avatar
          src={user.avatar}
          alt={user.name}
          size={size}
          className={`${showStatus || showRole ? 'ring-2 ring-white dark:ring-gray-800' : ''}`}
        />
        
        {/* Online status indicator */}
        {showStatus && user.isOnline !== undefined && (
          <div className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} rounded-full border-2 border-white dark:border-gray-800 ${
            user.isOnline ? 'bg-green-400' : 'bg-gray-400'
          }`} />
        )}
        
        {/* Role indicator */}
        {showRole && (user.role === 'admin' || user.role === 'manager') && (
          <div className={`absolute -top-1 -right-1 ${roleIconSizes[size]} bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700`}>
            {getRoleIcon(user.role)}
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <UserTooltip 
          user={user} 
          showRole={true}
          position={tooltipPosition}
        />
      )}
    </div>
  );
};

// Group of user avatars with overlap
interface UserAvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  showStatus?: boolean;
  onUserClick?: (user: User) => void;
  onMoreClick?: () => void;
  className?: string;
}

export const UserAvatarGroup: React.FC<UserAvatarGroupProps> = ({
  users,
  max = 5,
  size = 'md',
  showTooltip = true,
  showStatus = false,
  onUserClick,
  onMoreClick,
  className = ''
}) => {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const spacingClasses = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-2.5',
    xl: '-space-x-3'
  };

  const moreSizes = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base'
  };

  return (
    <div className={`flex items-center ${spacingClasses[size]} ${className}`}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={user.id}
          user={user}
          size={size}
          showTooltip={showTooltip}
          showStatus={showStatus}
          clickable={!!onUserClick}
          onClick={onUserClick}
          className={`relative z-${10 - index} border-2 border-white dark:border-gray-800`}
        />
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`${moreSizes[size]} bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center font-medium text-gray-600 dark:text-gray-300 ${
            onMoreClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''
          } transition-colors`}
          onClick={onMoreClick}
          title={`+${remainingCount} more users`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Simple user avatar with just name initial if no image
interface SimpleUserAvatarProps {
  user: Partial<User> & { name: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SimpleUserAvatar: React.FC<SimpleUserAvatarProps> = ({
  user,
  size = 'md',
  className = ''
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  if (user.avatar) {
    return (
      <Avatar
        src={user.avatar}
        alt={user.name}
        size={size}
        className={className}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center text-white font-medium ${className}`}>
      {getInitials(user.name)}
    </div>
  );
};