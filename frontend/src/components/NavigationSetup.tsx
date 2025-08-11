import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationService } from '../services/navigationService';

interface NavigationSetupProps {
  children: React.ReactNode;
}

// Component that sets up navigation and renders children
export const NavigationSetup: React.FC<NavigationSetupProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🧭 NavigationSetup: Setting up NavigationService');
    NavigationService.setNavigate(navigate);
    console.log('✅ NavigationSetup: NavigationService setup complete');
  }, [navigate]);

  return <>{children}</>;
};
