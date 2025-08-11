import React from 'react';
import { NotificationDropdown } from './NotificationDropdown';
import { UserDropdown } from './UserDropdown';

export const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-end w-full h-full">
      {/* Right side - Notifications and User */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <NotificationDropdown />

        {/* User dropdown */}
        <UserDropdown />
      </div>
    </div>
  );
};