import React from 'react';
import { Menu, X } from 'lucide-react';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      className="mobile-menu-button p-2 rounded-md bg-white shadow-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
      onClick={onClick}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="sidebar"
    >
      <div className="relative w-6 h-6">
        <span
          className={`
            absolute inset-0 transform transition-all duration-200 ease-in-out
            ${isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1'}
          `}
        >
          <Menu className={`w-6 h-6 ${isOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`} />
        </span>
        <span
          className={`
            absolute inset-0 transform transition-all duration-200 ease-in-out
            ${isOpen ? 'rotate-0 translate-y-0' : 'translate-y-1'}
          `}
        >
          <X className={`w-6 h-6 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} />
        </span>
      </div>
    </button>
  );
};