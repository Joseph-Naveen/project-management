import React from 'react';
import { Button } from './Button';
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  Server, 
  FileX,
  Shield
} from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: 'default' | 'network' | 'server' | 'notFound' | 'unauthorized';
  className?: string;
}

const errorVariants = {
  default: {
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.'
  },
  network: {
    icon: <Wifi className="h-12 w-12 text-orange-500" />,
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.'
  },
  server: {
    icon: <Server className="h-12 w-12 text-red-500" />,
    title: 'Server Error',
    message: 'The server encountered an error. Please try again later.'
  },
  notFound: {
    icon: <FileX className="h-12 w-12 text-gray-500" />,
    title: 'Not Found',
    message: 'The requested resource could not be found.'
  },
  unauthorized: {
    icon: <Shield className="h-12 w-12 text-red-500" />,
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.'
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  variant = 'default',
  className = ''
}) => {
  const errorConfig = errorVariants[variant];
  const displayTitle = title || errorConfig.title;
  const displayMessage = message || errorConfig.message;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {errorConfig.icon}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {displayTitle}
        </h3>
        
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          {displayMessage}
        </p>
        
        {onRetry && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={onRetry}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Predefined error states for common scenarios
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    variant="network"
    onRetry={onRetry}
  />
);

export const ServerError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    variant="server"
    onRetry={onRetry}
  />
);

export const NotFoundError: React.FC = () => (
  <ErrorState
    variant="notFound"
  />
);

export const UnauthorizedError: React.FC = () => (
  <ErrorState
    variant="unauthorized"
  />
);

// Error boundary fallback component
export const ErrorFallback: React.FC<{ 
  error: Error; 
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <ErrorState
      title="Something went wrong"
      message={error.message || 'An unexpected error occurred'}
      onRetry={resetErrorBoundary}
    />
  </div>
); 