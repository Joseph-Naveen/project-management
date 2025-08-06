import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { ROUTES } from '../constants';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md w-full">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-8">
            <div className="text-blue-600 text-4xl font-bold">404</div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Page not found
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go back
            </Button>
            
            <Link to={ROUTES.DASHBOARD}>
              <Button className="inline-flex items-center w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
              If you believe this is an error, please{' '}
              <a
                href="mailto:support@example.com"
                className="text-blue-600 hover:text-blue-500"
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};