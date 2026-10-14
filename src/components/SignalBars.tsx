import React from 'react';
import { Wifi, Smartphone, Radio } from 'lucide-react';
import { NetworkInterfaceId } from '../types/network';
import { evaluateWifiSignal, evaluateCellularSignal, getSignalColorClass } from '../utils/signal';

interface SignalBarsProps {
  type: NetworkInterfaceId;
  dBm: number;
  showDbmText?: boolean;
  showQualityLabel?: boolean;
  showBand?: boolean;
  bandText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SignalBars: React.FC<SignalBarsProps> = ({
  type,
  dBm,
  showDbmText = true,
  showQualityLabel = false,
  showBand = false,
  bandText,
  size = 'md',
}) => {
  const isWifi = type === 'wifi';
  const metrics = isWifi
    ? evaluateWifiSignal(dBm, bandText)
    : evaluateCellularSignal(dBm, bandText, type === 'sim2');

  const color = getSignalColorClass(metrics.quality);

  const barHeights = ['h-1.5', 'h-2.5', 'h-3.5', 'h-4.5'];
  const barHeightsLg = ['h-2', 'h-3.5', 'h-5', 'h-6.5'];

  const heights = size === 'lg' ? barHeightsLg : barHeights;
  const barWidth = size === 'sm' ? 'w-1' : size === 'lg' ? 'w-1.5' : 'w-1.2';

  return (
    <div className="inline-flex items-center gap-2">
      {/* Cellular Stair-step or Wi-Fi Bars */}
      {!isWifi ? (
        <div
          className="flex items-end gap-0.5"
          title={`Cellular Signal: ${dBm} dBm (${metrics.quality}) · ${metrics.secondaryMetric}`}
        >
          {[1, 2, 3, 4].map((barIndex) => {
            const isFilled = barIndex <= metrics.bars;
            return (
              <span
                key={barIndex}
                className={`${barWidth} ${heights[barIndex - 1]} rounded-2xs transition-colors ${
                  isFilled ? color.bg : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      ) : (
        /* Wi-Fi Wave / Stepped Bars */
        <div
          className="flex items-end gap-0.5"
          title={`Wi-Fi RSSI: ${dBm} dBm (${metrics.quality}) · ${metrics.secondaryMetric}`}
        >
          {[1, 2, 3, 4].map((barIndex) => {
            const isFilled = barIndex <= metrics.bars;
            return (
              <span
                key={barIndex}
                className={`${barWidth} ${heights[barIndex - 1]} rounded-2xs transition-colors ${
                  isFilled ? color.bg : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Numeric dBm Tag */}
      {showDbmText && (
        <span
          className={`font-mono font-medium ${
            size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-sm' : 'text-xs'
          } ${color.text}`}
        >
          {dBm} dBm
        </span>
      )}

      {/* Quality Badge */}
      {showQualityLabel && (
        <span
          className={`text-[10px] font-sans font-medium px-1.5 py-0.2 rounded border ${color.badgeBg} ${color.text} ${color.border}`}
        >
          {metrics.quality}
        </span>
      )}

      {/* RF Band info */}
      {showBand && (
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          · {metrics.frequencyOrBand}
        </span>
      )}
    </div>
  );
};
