import { ROUTES } from '../constants';

// Navigation service for consistent routing across the app
class NavigationService {
  private static navigate: ((to: string, options?: { replace?: boolean }) => void) | null = null;

  // Set the navigate function from React Router
  static setNavigate(navigate: (to: string, options?: { replace?: boolean }) => void) {
    this.navigate = navigate;
  }

  // Navigate to login page
  static toLogin(replace = true) {
    if (this.navigate) {
      this.navigate(ROUTES.LOGIN, { replace });
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = ROUTES.LOGIN;
    }
  }

  // Navigate to dashboard
  static toDashboard(replace = true) {
    if (this.navigate) {
      this.navigate(ROUTES.DASHBOARD, { replace });
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = ROUTES.DASHBOARD;
    }
  }

  // Navigate to any route
  static to(route: string, replace = false) {
    if (this.navigate) {
      this.navigate(route, { replace });
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = route;
    }
  }

  // Navigate to unauthorized page
  static toUnauthorized(replace = true) {
    if (this.navigate) {
      this.navigate(ROUTES.UNAUTHORIZED, { replace });
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = ROUTES.UNAUTHORIZED;
    }
  }
}

export { NavigationService };
