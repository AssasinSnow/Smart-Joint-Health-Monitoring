import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  AlertTriangle,
  Menu
} from 'lucide-react';
import { useJointStore } from '../../store/useJointStore';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { alerts } = useJointStore();
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const tabs = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live', icon: Activity },
    { to: '/predictive', label: 'Health', icon: TrendingUp },
    {
      to: '/alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      badge: unacknowledgedCount > 0 ? unacknowledgedCount : undefined
    }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-200 dark:border-navy-700 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 px-2 flex items-center justify-around shadow-lg transition-colors"
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-copper-600 dark:text-copper-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 text-[10px] font-mono font-bold rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </NavLink>
        );
      })}

      {/* Menu / More Button */}
      <button
        onClick={onOpenMenu}
        aria-label="Open More Menu Options"
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-all"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
};
