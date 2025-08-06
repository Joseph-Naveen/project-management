import { useState, useEffect, useCallback, useRef } from 'react';

// Type for the hook's return value
type UseLocalStorageReturn<T> = [
  T,
  (value: T | ((prevValue: T) => T)) => void,
  () => void
];

// Options for the useLocalStorage hook
interface UseLocalStorageOptions<T> {
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  syncAcrossTabs?: boolean;
  onError?: (error: Error, key: string) => void;
}

// Default serializer using JSON
const defaultSerializer = {
  read: <T>(value: string): T => {
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  },
  write: <T>(value: T): string => {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
};

// Hook for managing localStorage with React state synchronization
export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> => {
  const {
    serializer = defaultSerializer,
    syncAcrossTabs = true,
    onError
  } = options;

  // Use a ref to store the current value to avoid stale closures
  const valueRef = useRef<T>(initialValue);

  // Read value from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsedValue = serializer.read(item);
      valueRef.current = parsedValue;
      return parsedValue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, key);
      console.warn(`Error reading localStorage key "${key}":`, err);
      return initialValue;
    }
  }, [initialValue, key, serializer, onError]);

  // State to trigger re-renders
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Write value to localStorage
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn('useLocalStorage: localStorage is not available');
      return;
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = typeof value === 'function' 
        ? (value as (prevValue: T) => T)(valueRef.current)
        : value;

      // Save to localStorage
      window.localStorage.setItem(key, serializer.write(newValue));
      
      // Save state
      valueRef.current = newValue;
      setStoredValue(newValue);

      // Dispatch custom event for cross-tab synchronization
      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, value: newValue }
          })
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, key);
      console.warn(`Error setting localStorage key "${key}":`, err);
    }
  }, [key, serializer, syncAcrossTabs, onError]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('useLocalStorage: localStorage is not available');
      return;
    }

    try {
      window.localStorage.removeItem(key);
      valueRef.current = initialValue;
      setStoredValue(initialValue);

      // Dispatch custom event for cross-tab synchronization
      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, value: null }
          })
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, key);
      console.warn(`Error removing localStorage key "${key}":`, err);
    }
  }, [key, initialValue, syncAcrossTabs, onError]);

  // Listen for changes in localStorage (for cross-tab synchronization)
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== localStorage) {
        return;
      }

      try {
        const newValue = e.newValue === null 
          ? initialValue 
          : serializer.read(e.newValue);
        
        valueRef.current = newValue;
        setStoredValue(newValue);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err, key);
        console.warn(`Error handling storage change for key "${key}":`, err);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key !== key) {
        return;
      }

      const newValue = e.detail.value === null ? initialValue : e.detail.value;
      valueRef.current = newValue;
      setStoredValue(newValue);
    };

    // Listen to both native storage events and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomStorageChange as EventListener);
    };
  }, [key, initialValue, serializer, syncAcrossTabs, onError]);

  // Sync with localStorage on mount
  useEffect(() => {
    const currentValue = readValue();
    if (currentValue !== storedValue) {
      setStoredValue(currentValue);
    }
  }, [readValue, storedValue]);

  return [storedValue, setValue, removeValue];
};

// Hook for session storage (similar to localStorage but session-scoped)
export const useSessionStorage = <T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, 'syncAcrossTabs'> = {}
) => {
  const {
    serializer = defaultSerializer,
    onError
  } = options;

  const valueRef = useRef<T>(initialValue);

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsedValue = serializer.read(item);
      valueRef.current = parsedValue;
      return parsedValue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, key);
      console.warn(`Error reading sessionStorage key "${key}":`, err);
      return initialValue;
    }
  }, [initialValue, key, serializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn('useSessionStorage: sessionStorage is not available');
      return;
    }

    try {
      const newValue = typeof value === 'function' 
        ? (value as (prevValue: T) => T)(valueRef.current)
        : value;

      window.sessionStorage.setItem(key, serializer.write(newValue));
      valueRef.current = newValue;
      setStoredValue(newValue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, key);
      console.warn(`Error setting sessionStorage key "${key}":`, err);
    }
  }, [key, serializer, onError]);

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('useSessionStorage: sessionStorage is not available');
      return;
    }

    try {
      window.sessionStorage.removeItem(key);
      valueRef.current = initialValue;
      setStoredValue(initialValue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, key);
      console.warn(`Error removing sessionStorage key "${key}":`, err);
    }
  }, [key, initialValue, onError]);

  useEffect(() => {
    const currentValue = readValue();
    if (currentValue !== storedValue) {
      setStoredValue(currentValue);
    }
  }, [readValue, storedValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Hook for managing multiple localStorage keys as a single object
export const useLocalStorageState = <T extends Record<string, any>>(
  keyPrefix: string,
  initialState: T,
  options: UseLocalStorageOptions<any> = {}
) => {
  const [state, setState] = useState<T>(initialState);
  const { onError } = options;

  // Load initial state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadedState = { ...initialState };
    let hasChanges = false;

    Object.keys(initialState).forEach(key => {
      try {
        const storageKey = `${keyPrefix}.${key}`;
        const item = window.localStorage.getItem(storageKey);
        
        if (item !== null) {
          loadedState[key as keyof T] = JSON.parse(item);
          hasChanges = true;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err, `${keyPrefix}.${key}`);
        console.warn(`Error loading localStorage state for key "${keyPrefix}.${key}":`, err);
      }
    });

    if (hasChanges) {
      setState(loadedState);
    }
  }, [keyPrefix, initialState, onError]);

  // Update localStorage when state changes
  const updateState = useCallback((updates: Partial<T> | ((prevState: T) => Partial<T>)) => {
    setState(prevState => {
      const newUpdates = typeof updates === 'function' ? updates(prevState) : updates;
      const newState = { ...prevState, ...newUpdates };

      // Save each changed key to localStorage
      Object.keys(newUpdates).forEach(key => {
        try {
          const storageKey = `${keyPrefix}.${key}`;
          window.localStorage.setItem(storageKey, JSON.stringify(newState[key as keyof T]));
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          onError?.(err, `${keyPrefix}.${key}`);
          console.warn(`Error saving localStorage state for key "${keyPrefix}.${key}":`, err);
        }
      });

      return newState;
    });
  }, [keyPrefix, onError]);

  // Clear all related localStorage keys
  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return;

    Object.keys(state).forEach(key => {
      try {
        const storageKey = `${keyPrefix}.${key}`;
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err, `${keyPrefix}.${key}`);
        console.warn(`Error clearing localStorage state for key "${keyPrefix}.${key}":`, err);
      }
    });

    setState(initialState);
  }, [keyPrefix, state, initialState, onError]);

  return [state, updateState, clearState] as const;
};

// Utility hooks for common localStorage patterns
export const useLocalStorageBoolean = (key: string, initialValue = false) => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageNumber = (key: string, initialValue = 0) => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageString = (key: string, initialValue = '') => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageArray = <T>(key: string, initialValue: T[] = []) => {
  return useLocalStorage<T[]>(key, initialValue);
};

export const useLocalStorageObject = <T extends Record<string, any>>(
  key: string, 
  initialValue: T
) => {
  return useLocalStorage<T>(key, initialValue);
};

// Hook for persisting form data
export const usePersistedForm = <T extends Record<string, any>>(
  formKey: string,
  initialValues: T,
  options: { 
    clearOnSubmit?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const { clearOnSubmit = true, debounceMs = 500 } = options;
  const [values, setValues, clearValues] = useLocalStorage<T>(`form.${formKey}`, initialValues);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced update function
  const updateValues = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setValues(prevValues => {
        return typeof updates === 'function' 
          ? updates(prevValues)
          : { ...prevValues, ...updates };
      });
    }, debounceMs);
  }, [setValues, debounceMs]);

  // Clear form data (e.g., on successful submit)
  const handleSubmit = useCallback(() => {
    if (clearOnSubmit) {
      clearValues();
    }
  }, [clearOnSubmit, clearValues]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    values,
    updateValues,
    clearValues,
    handleSubmit
  };
};

// Hook for managing user preferences
export const useUserPreferences = <T extends Record<string, any>>(
  userId: string,
  defaultPreferences: T
) => {
  const storageKey = `user-preferences.${userId}`;
  const [preferences, setPreferences, clearPreferences] = useLocalStorage<T>(
    storageKey,
    defaultPreferences
  );

  const updatePreference = useCallback(<K extends keyof T>(
    key: K,
    value: T[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setPreferences]);

  const resetToDefaults = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  return {
    preferences,
    updatePreference,
    setPreferences,
    clearPreferences,
    resetToDefaults
  };
};

// Hook for managing application state that should persist
export const useAppState = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageBoolean('app.sidebar.collapsed', false);
  const [theme, setTheme] = useLocalStorageString('app.theme', 'light');
  const [language, setLanguage] = useLocalStorageString('app.language', 'en');
  const [recentProjects, setRecentProjects] = useLocalStorageArray<string>('app.recent.projects', []);
  const [recentTasks, setRecentTasks] = useLocalStorageArray<string>('app.recent.tasks', []);

  const addRecentProject = useCallback((projectId: string) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(id => id !== projectId);
      return [projectId, ...filtered].slice(0, 10); // Keep only last 10
    });
  }, [setRecentProjects]);

  const addRecentTask = useCallback((taskId: string) => {
    setRecentTasks(prev => {
      const filtered = prev.filter(id => id !== taskId);
      return [taskId, ...filtered].slice(0, 10); // Keep only last 10
    });
  }, [setRecentTasks]);

  const clearRecentItems = useCallback(() => {
    setRecentProjects([]);
    setRecentTasks([]);
  }, [setRecentProjects, setRecentTasks]);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    setTheme,
    language,
    setLanguage,
    recentProjects,
    recentTasks,
    addRecentProject,
    addRecentTask,
    clearRecentItems
  };
};