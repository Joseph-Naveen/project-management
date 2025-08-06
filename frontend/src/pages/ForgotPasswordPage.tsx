import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';
import { ROUTES } from '../constants';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      if (response.success) {
        setIsSubmitted(true);
        toast.success('Password reset email sent successfully!');
      } else {
        toast.error(response.message || 'Failed to send password reset email. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Brand Section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col justify-center items-center px-8 py-12 lg:py-0">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          {/* Project Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 text-center tracking-tight">
            Project Management Dashboard
          </h1>

          {/* Tagline */}
          <p className="text-xl lg:text-2xl text-blue-100 text-center mb-12 max-w-md leading-relaxed">
            Don't worry, we'll help you get back to managing your projects in no time
          </p>

          {/* Illustration */}
          <div className="w-full max-w-md">
            <div className="relative">
              {/* Abstract geometric shapes */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute top-8 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
              </div>
              
              {/* Main illustration */}
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="flex justify-center mb-6">
                  <div className="bg-white/20 rounded-full h-24 w-24 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-white/20 rounded-full"></div>
                  <div className="h-3 bg-white/20 rounded-full w-3/4"></div>
                  <div className="h-3 bg-white/20 rounded-full w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Success Message */}
        <div className="lg:w-1/2 bg-white flex items-center justify-center px-8 py-12 lg:py-0">
          <div className="w-full max-w-md">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{getValues('email')}</strong>
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-blue-800 mb-4">
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <p className="text-xs text-blue-600">
                Didn't receive the email? Check your spam folder or click the button below to try again.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center shadow-md hover:shadow-lg"
              >
                Send another email
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <Link
                to={ROUTES.LOGIN}
                className="w-full border border-gray-200 text-gray-700 py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-500/20 flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand Section */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col justify-center items-center px-8 py-12 lg:py-0">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        {/* Project Title */}
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 text-center tracking-tight">
          Project Management Dashboard
        </h1>

        {/* Tagline */}
        <p className="text-xl lg:text-2xl text-blue-100 text-center mb-12 max-w-md leading-relaxed">
          Don't worry, we'll help you get back to managing your projects in no time
        </p>

        {/* Illustration */}
        <div className="w-full max-w-md">
          <div className="relative">
            {/* Abstract geometric shapes */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute top-8 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
            </div>
            
            {/* Main illustration */}
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="flex justify-center mb-6">
                <div className="bg-white/20 rounded-full h-24 w-24 flex items-center justify-center">
                  <Mail className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-white/20 rounded-full"></div>
                <div className="h-3 bg-white/20 rounded-full w-3/4"></div>
                <div className="h-3 bg-white/20 rounded-full w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center px-8 py-12 lg:py-0">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h2>
            <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`block w-full pl-12 pr-4 py-3.5 border rounded-lg text-sm transition-all duration-200 bg-white ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                  } focus:outline-none focus:ring-4 focus:ring-opacity-20 placeholder-gray-400`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending reset link...
                </div>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 