import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Debounces a value by delaying updates until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 * 
 * @param value - The value to debounce
 * @param delay - The number of milliseconds to delay
 * @returns The debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes (cancel previous debounce)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useDebounceCallback hook
 * Returns a debounced version of the callback function
 * 
 * @param callback - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @param deps - Dependencies array (similar to useCallback)
 * @returns The debounced callback function
 */
export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  }) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Reset timer when dependencies change
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, deps);

  return debouncedCallback;
};