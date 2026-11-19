import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge
}) => {
  return (
    <div className="mocha-card p-6 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lavender/80 font-sans">
            {title}
          </p>
          <h3 className="font-sans text-3xl font-bold text-silver mt-2 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-silver/60 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="w-11 h-11 rounded-xl bg-mocha-800 border border-silver/20 flex items-center justify-center group-hover:border-lavender/50 transition-colors">
          <Icon className="w-5 h-5 text-lavender" />
        </div>
      </div>

      {badge && (
        <div className="mt-4 pt-3 border-t border-silver/10 flex items-center justify-between text-xs">
          <span className="text-silver/60">Metric Status</span>
          <span className="badge-lavender text-[11px] font-medium">{badge}</span>
        </div>
      )}
    </div>
  );
};

