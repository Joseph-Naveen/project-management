// Common Utility Types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type ID = string;

// Form Types
export interface FormError {
  field: string;
  message: string;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (record: T) => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
}

// Filter Types
export interface FilterOption {
  label: string;
  value: string | number;
}

export interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string | number | null;
    onChange: (value: string | number | null) => void;
  }[];
}

// Dashboard Types
export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    timeframe: string;
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark';

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  protected?: boolean;
  roles?: string[];
  title?: string;
}

// Error Types
export interface ErrorInfo {
  message: string;
  code?: string | number;
  field?: string;
}

// Loading State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Sort Types
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Date Range Types
export interface DateRange {
  startDate: string;
  endDate: string;
} 