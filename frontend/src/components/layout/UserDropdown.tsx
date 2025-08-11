import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { NavigationService } from '../../services/navigationService';
import { ROUTES } from '../../constants';

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthContext();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: User,
      onClick: () => {
        NavigationService.to(ROUTES.PROFILE);
        setIsOpen(false);
      },
      divider: true
    },
    {
      label: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
      divider: false,
      className: 'text-red-600 hover:text-red-700'
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar
          src={user?.avatar}
          alt={user?.name || 'User'}
          size="sm"
          className="h-8 w-8"
        />
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Avatar
                src={user?.avatar}
                alt={user?.name || 'User'}
                size="sm"
                className="h-10 w-10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.label}>
                  <button
                    className={`w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${item.className || ''}`}
                    onClick={item.onClick}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </button>
                  {item.divider && index < menuItems.length - 1 && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};