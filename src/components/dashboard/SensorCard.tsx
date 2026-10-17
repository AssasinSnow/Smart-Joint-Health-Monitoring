import React from 'react';
import { MetricCard } from '../common/MetricCard';
import { Sparkline } from './Sparkline';
import { StatusType } from '../../lib/formatters';

interface SensorCardProps {
  title: string;
  sensorType: string;
  value: number | string | null | undefined;
  unit: string;
  decimals?: number;
  status: StatusType;
  icon: React.ReactNode;
  baselineText: string;
  subValue?: string;
  historyData: number[];
  sparklineColor?: string;
  alertText?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  sensorType,
  value,
  unit,
  decimals = 2,
  status,
  icon,
  baselineText,
  subValue,
  historyData,
  sparklineColor = '#F59E0B',
  alertText
}) => {
  return (
    <MetricCard
      title={title}
      sensorType={sensorType}
      value={value}
      unit={unit}
      decimals={decimals}
      status={status}
      icon={icon}
      baselineText={baselineText}
      subValue={subValue}
      alertText={alertText}
    >
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] font-mono text-slate-400">Live Trend:</span>
        <Sparkline
          data={historyData}
          color={sparklineColor}
          height={32}
          width={110}
        />
      </div>
    </MetricCard>
  );
};
