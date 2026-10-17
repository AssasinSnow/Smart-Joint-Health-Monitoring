import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  AlertTriangle,
  Sliders,
  ClipboardList,
  BookOpen,
  X
} from 'lucide-react';
import { useJointStore } from '../../store/useJointStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { alerts, currentPoint } = useJointStore();
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live Monitoring', icon: Activity },
    { to: '/predictive', label: 'Predictive Health', icon: TrendingUp },
    {
      to: '/alerts',
      label: 'Alerts & Safety',
      icon: AlertTriangle,
      badge: unacknowledgedCount > 0 ? unacknowledgedCount : undefined
    },
    { to: '/settings', label: 'Device Settings', icon: Sliders },
    { to: '/records', label: 'Maintenance Log', icon: ClipboardList },
    { to: '/info', label: 'Project Info & Setup', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-700 z-50 lg:static lg:z-auto lg:w-64 transition-transform duration-200 ease-in-out flex flex-col justify-between overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Mobile close bar */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-navy-700 lg:hidden">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 sm:p-4 space-y-1">
            <div className="px-3 py-2 text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">
              Operations Center
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-copper-500 text-white font-semibold shadow-sm shadow-copper-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-red-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Busbar telemetry quick status footer */}
        <div className="p-4 m-3 sm:m-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700/80 mb-6 lg:mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            <span>Busbar Phase A</span>
            <span className="font-mono text-copper-500 font-bold">M10 Cu</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Contact Force:</span>
              <span className="tabular-nums font-bold text-slate-700 dark:text-slate-200">
                {currentPoint ? `${currentPoint.force_N.toLocaleString()} N` : '-- N'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Joint Temp:</span>
              <span className="tabular-nums font-bold text-slate-700 dark:text-slate-200">
                {currentPoint ? `${currentPoint.tempJoint_C.toFixed(1)} °C` : '-- °C'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current:</span>
              <span className="tabular-nums font-bold text-slate-700 dark:text-slate-200">
                {currentPoint ? `${currentPoint.current_A.toFixed(1)} A` : '-- A'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
