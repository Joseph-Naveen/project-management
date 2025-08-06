import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationService } from '../../services/navigationService';

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the navigation service with React Router's navigate function
    NavigationService.setNavigate(navigate);
  }, [navigate]);

  return <>{children}</>;
};
