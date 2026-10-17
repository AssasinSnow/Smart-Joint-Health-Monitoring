import { CheckCircle2, AlertTriangle, AlertOctagon, WifiOff, FlaskConical } from 'lucide-react';
import React from 'react';

export type StatusType = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'DEMO' | 'INFO';

export interface StatusVisual {
  type: StatusType;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export function getStatusVisual(status: StatusType): StatusVisual {
  switch (status) {
    case 'HEALTHY':
      return {
        type: 'HEALTHY',
        label: 'Healthy ✔',
        colorClass: 'text-emerald-500 dark:text-emerald-400',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderClass: 'border-emerald-500/30',
        badgeClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20',
        Icon: CheckCircle2
      };
    case 'WARNING':
      return {
        type: 'WARNING',
        label: 'Warning ⚠',
        colorClass: 'text-amber-500 dark:text-amber-400',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        borderClass: 'border-amber-500/30',
        badgeClass: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20',
        Icon: AlertTriangle
      };
    case 'CRITICAL':
      return {
        type: 'CRITICAL',
        label: 'Critical ⛔',
        colorClass: 'text-red-500 dark:text-red-400',
        bgClass: 'bg-red-50 dark:bg-red-950/40',
        borderClass: 'border-red-500/30',
        badgeClass: 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20',
        Icon: AlertOctagon
      };
    case 'OFFLINE':
      return {
        type: 'OFFLINE',
        label: 'Offline ⏻',
        colorClass: 'text-slate-400 dark:text-slate-500',
        bgClass: 'bg-slate-100 dark:bg-slate-900/40',
        borderClass: 'border-slate-500/30',
        badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
        Icon: WifiOff
      };
    case 'DEMO':
      return {
        type: 'DEMO',
        label: 'Demo 🧪',
        colorClass: 'text-purple-500 dark:text-purple-400',
        bgClass: 'bg-purple-50 dark:bg-purple-950/40',
        borderClass: 'border-purple-500/30',
        badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        Icon: FlaskConical
      };
    case 'INFO':
      return {
        type: 'INFO',
        label: 'Info ℹ',
        colorClass: 'text-blue-500 dark:text-blue-400',
        bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        borderClass: 'border-blue-500/30',
        badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        Icon: CheckCircle2
      };
  }
}

/**
 * Format numbers with fixed decimals and tabular numeral friendly string
 */
export function formatTabularNumber(val: number | null | undefined, decimals: number = 2): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '--';
  }
  return val.toFixed(decimals);
}

/**
 * Format timestamp into readable time string
 */
export function formatTimeString(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTimeString(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Exports JSON array of objects to CSV download in browser
 */
export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return String(val);
    }).join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
