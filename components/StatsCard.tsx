import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  subtext?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, colorClass, subtext }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 shrink-0`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};