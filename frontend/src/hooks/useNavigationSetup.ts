import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationService } from '../services/navigationService';

// Hook to set up the navigation service
export const useNavigationSetup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    NavigationService.setNavigate(navigate);
  }, [navigate]);
};
