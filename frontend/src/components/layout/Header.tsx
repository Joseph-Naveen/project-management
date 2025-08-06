import React from 'react';
import { Search } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { UserDropdown } from './UserDropdown';

export const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* Left side - Search */}
      <div className="flex items-center space-x-4 flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm transition-all duration-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none placeholder-gray-400 hover:border-gray-300"
          />
        </div>
      </div>

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