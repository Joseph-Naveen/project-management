import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';



interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: {
    value: number;
    period: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  error?: boolean;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  color = 'blue',
  size = 'md',
  loading = false,
  error = false,
  className = ''
}) => {
  // const { colors } = useTheme(); // Not used currently

  // Color mappings
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      icon: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  // Size mappings
  const sizeClasses = {
    sm: {
      padding: 'p-4',
      iconSize: 16,
      titleSize: 'text-sm',
      valueSize: 'text-lg',
      changeSize: 'text-xs'
    },
    md: {
      padding: 'p-6',
      iconSize: 20,
      titleSize: 'text-sm',
      valueSize: 'text-2xl',
      changeSize: 'text-sm'
    },
    lg: {
      padding: 'p-8',
      iconSize: 24,
      titleSize: 'text-base',
      valueSize: 'text-3xl',
      changeSize: 'text-base'
    }
  };

  const selectedColor = colorClasses[color];
  const selectedSize = sizeClasses[size];

  // Format large numbers
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    
    return val.toLocaleString();
  };

  // Get trend icon and color
  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp size={14} className="text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown size={14} className="text-red-600 dark:text-red-400" />;
      case 'neutral':
        return <Minus size={14} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className={`${selectedSize.padding} ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${selectedSize.padding} border border-red-200 dark:border-red-800 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.768 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Error loading data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${selectedSize.padding} transition-all duration-200 hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-medium text-gray-900 dark:text-white ${selectedSize.titleSize}`}>
          {title}
        </h3>
        {Icon && (
          <div className={`${selectedColor.bg} ${selectedColor.border} p-2 rounded-lg border`}>
            <Icon size={selectedSize.iconSize} className={selectedColor.icon} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`font-bold text-gray-900 dark:text-white ${selectedSize.valueSize} mb-2`}>
        {formatValue(value)}
      </div>

      {/* Change indicator */}
      {change && (
        <div className="flex items-center gap-1">
          {getTrendIcon(change.direction)}
          <span className={`${getTrendColor(change.direction)} ${selectedSize.changeSize} font-medium`}>
            {change.direction !== 'neutral' && (change.direction === 'up' ? '+' : '')}{change.value}%
          </span>
          <span className={`text-gray-600 dark:text-gray-400 ${selectedSize.changeSize}`}>
            vs {change.period}
          </span>
        </div>
      )}
    </Card>
  );
};

// Grid of stats cards
interface StatsGridProps {
  stats: Array<StatsCardProps & { id: string }>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 4,
  className = ''
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid gap-6 ${gridClasses[columns]} ${className}`}>
      {stats.map(({ id, ...statProps }) => (
        <StatsCard key={id} {...statProps} />
      ))}
    </div>
  );
};

// Compact stats card for smaller spaces
interface CompactStatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

export const CompactStatsCard: React.FC<CompactStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {Icon && (
        <div className={`${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{title}</p>
        <p className="font-semibold text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
};