import React, { ReactNode } from 'react';
import { TrendingUp, Minus } from 'lucide-react';

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  trend,
  trendUp,
  badge,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm hover:border-primary/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
          {icon}
        </div>
        {trend && (
          <span
            className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-full ${
              trendUp
                ? 'bg-secondary-container/30 text-secondary'
                : 'bg-surface-container text-outline'
            }`}
          >
            {trendUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <Minus className="w-3.5 h-3.5 mr-1" />}{' '}
            {trend}
          </span>
        )}
        {badge && (
          <span className="flex items-center gap-1.5 bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span> {badge}
          </span>
        )}
      </div>
      <p className="text-body-md text-on-surface-variant text-sm mb-1">{title}</p>
      <h3 className="text-headline-lg text-on-surface">{value}</h3>
    </div>
  );
};
