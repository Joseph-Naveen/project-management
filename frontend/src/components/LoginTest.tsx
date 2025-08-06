import React, { useState } from 'react';
import { authService } from '../services';
import type { ApiResponse, User } from '../types';

interface LoginTestProps {
  onClose: () => void;
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const LoginTest: React.FC<LoginTestProps> = ({ onClose }) => {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse<LoginResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testCredentials = [
    { role: 'ADMIN', email: 'admin@test.com', password: 'password123' },
    { role: 'MANAGER', email: 'manager@test.com', password: 'password123' },
    { role: 'DEVELOPER', email: 'developer@test.com', password: 'password123' },
    { role: 'QA', email: 'qa@test.com', password: 'password123' },
  ];

  const handleLogin = async (testEmail?: string, testPassword?: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const loginEmail = testEmail || email;
      const loginPassword = testPassword || password;
      
      console.log('Testing login with:', { email: loginEmail, password: loginPassword });
      
      const response = await authService.login({ 
        email: loginEmail, 
        password: loginPassword 
      });
      
      setResult(response);
      console.log('Login successful:', response);
      
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTest = (credentials: { email: string; password: string }) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    handleLogin(credentials.email, credentials.password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🧪 Login Test</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Quick Test Buttons */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Test Credentials:</h3>
            <div className="grid grid-cols-2 gap-2">
              {testCredentials.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => handleQuickTest(cred)}
                  disabled={isLoading}
                  className="p-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border disabled:opacity-50"
                >
                  {cred.role}: {cred.email}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Test Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={() => handleLogin()}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Login'}
            </button>
          </div>

          {/* Results */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              <strong>✅ Success!</strong>
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
