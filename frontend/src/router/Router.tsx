import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { NavigationSetup } from '../components/NavigationSetup';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../router/ProtectedRoute';
import { 
  LoginPage, 
  RegisterPage, 
  NotFoundPage, 
  UnauthorizedPage,
  ForgotPasswordPage,
  DashboardPage,
  ProjectsPage,
  ProjectDetailPage,
  TasksPage,
  TaskDetailPage,
  TeamPage,
  ProfilePage,
  TimesheetPage,
  ReportsPage,
  UsersPage
} from '../pages';
import { ROUTES } from '../constants';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <NavigationSetup>
        <Navigate to={ROUTES.DASHBOARD} replace />
      </NavigationSetup>
    ),
  },
  {
    path: '/',
    element: (
      <NavigationSetup>
        <ProtectedRoute>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </ProtectedRoute>
      </NavigationSetup>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.PROJECTS,
        element: <ProjectsPage />,
      },
      {
        path: ROUTES.PROJECT_DETAIL(':id'),
        element: <ProjectDetailPage />,
      },
      {
        path: ROUTES.TASKS,
        element: <TasksPage />,
      },
      {
        path: ROUTES.TASK_DETAIL(':id'),
        element: <TaskDetailPage />,
      },
      {
        path: ROUTES.TEAM,
        element: <TeamPage />,
      },
      {
        path: ROUTES.TIMESHEET,
        element: <TimesheetPage />,
      },
      {
        path: ROUTES.REPORTS,
        element: (
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.USER_MANAGEMENT,
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <NavigationSetup>
        <AuthLayout />
      </NavigationSetup>
    ),
    children: [
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.REGISTER,
        element: <RegisterPage />,
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    path: ROUTES.UNAUTHORIZED,
    element: (
      <NavigationSetup>
        <UnauthorizedPage />
      </NavigationSetup>
    ),
  },
  {
    path: ROUTES.NOT_FOUND,
    element: (
      <NavigationSetup>
        <NotFoundPage />
      </NavigationSetup>
    ),
  },
  {
    path: '*',
    element: (
      <NavigationSetup>
        <NotFoundPage />
      </NavigationSetup>
    ),
  },
]);