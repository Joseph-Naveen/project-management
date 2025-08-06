import React, { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // The actual resolved theme (light/dark only)
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  toggleTheme: () => void;
  isSystemTheme: boolean;
}

// Theme configurations
const themes: Record<'light' | 'dark', ThemeColors> = {
  light: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#9ca3af',
    accent: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa'
  }
};

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props for the ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

// ThemeProvider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', defaultTheme);
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Determine the actual theme to use
  const actualTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  // Update document class and CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(actualTheme);
    body.classList.add(actualTheme);

    // Set CSS custom properties for the current theme
    const colors = themes[actualTheme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Set theme-color meta tag for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', colors.primary);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = colors.primary;
      document.head.appendChild(meta);
    }

    // Update favicon based on theme (optional)
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // You could have different favicons for light/dark themes
      // favicon.href = actualTheme === 'dark' ? '/favicon-dark.ico' : '/favicon-light.ico';
    }

  }, [actualTheme]);

  // Toggle between light and dark (skips system)
  const toggleTheme = () => {
    setTheme(actualTheme === 'light' ? 'dark' : 'light');
  };

  const contextValue: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    colors: themes[actualTheme],
    toggleTheme,
    isSystemTheme: theme === 'system'
  };

  // Add theme transition class for smooth theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');

    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timer);
  }, [actualTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// Hook for theme-aware styling
export const useThemeStyles = () => {
  const { colors, actualTheme } = useTheme();

  const getThemeClass = (lightClass: string, darkClass?: string) => {
    if (!darkClass) return lightClass;
    return actualTheme === 'dark' ? darkClass : lightClass;
  };

  const getThemeStyle = (lightStyle: React.CSSProperties, darkStyle?: React.CSSProperties) => {
    if (!darkStyle) return lightStyle;
    return actualTheme === 'dark' ? darkStyle : lightStyle;
  };

  return {
    colors,
    actualTheme,
    getThemeClass,
    getThemeStyle
  };
};

// Component for theme-specific rendering
interface ThemeGuardProps {
  children: ReactNode;
  theme: 'light' | 'dark';
  fallback?: ReactNode;
}

export const ThemeGuard: React.FC<ThemeGuardProps> = ({
  children,
  theme,
  fallback = null
}) => {
  const { actualTheme } = useTheme();

  return actualTheme === theme ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextType }>
) => {
  const ThemedComponent = (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };

  ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  
  return ThemedComponent;
};

// Theme preferences hook for user settings
export const useThemePreferences = () => {
  const { theme, setTheme, actualTheme, isSystemTheme } = useTheme();

  const preferences = {
    theme,
    actualTheme,
    isSystemTheme,
    availableThemes: [
      { value: 'light' as const, label: 'Light', icon: '☀️' },
      { value: 'dark' as const, label: 'Dark', icon: '🌙' },
      { value: 'system' as const, label: 'System', icon: '💻' }
    ]
  };

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Announce theme change for accessibility
    const announcement = `Theme changed to ${newTheme === 'system' ? `system (${actualTheme})` : newTheme}`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    
    setTimeout(() => {
      document.body.removeChild(ariaLive);
    }, 1000);
  };

  return {
    ...preferences,
    updateTheme
  };
};