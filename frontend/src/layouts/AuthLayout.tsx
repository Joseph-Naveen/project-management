import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { LoadingSpinner } from '../components/ui'
import { useNavigationSetup } from '../hooks/useNavigationSetup'

export const AuthLayout = () => {
  // Set up navigation service
  useNavigationSetup();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center w-full">
      <div className="w-full ">
        <div className="bg-white shadow-lg sm:rounded-lg">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
