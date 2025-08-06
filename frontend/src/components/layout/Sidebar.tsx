
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRoleBasedNavigation } from '../../hooks/useRoleBasedNavigation';

export const Sidebar: React.FC = () => {
  const { navigation, user } = useRoleBasedNavigation();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo/Brand - Simplified */}
      <div className="flex items-center justify-start h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-900">ProjectHub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2" role="navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }: { isActive: boolean }) => `
                group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200" aria-hidden="true" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User info and role badge */}
      {user && user.name && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || 'Unknown User'}
              </p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                  user.role === 'developer' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                {user.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Minimal */}
      <div className="px-6 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>© 2025 ProjectHub</p>
        </div>
      </div>
    </div>
  );
};