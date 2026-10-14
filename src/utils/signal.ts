export interface SignalMetrics {
  dBm: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  bars: number; // 1 to 4
  frequencyOrBand: string;
  secondaryMetric: string;
  technology: string;
}

export function evaluateWifiSignal(dBm: number, band: string = '5.0 GHz (Ch 44)'): SignalMetrics {
  let quality: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Good';
  let bars = 3;
  let snr = 28;

  if (dBm >= -50) {
    quality = 'Excellent';
    bars = 4;
    snr = 42;
  } else if (dBm >= -65) {
    quality = 'Good';
    bars = 3;
    snr = 29;
  } else if (dBm >= -75) {
    quality = 'Fair';
    bars = 2;
    snr = 18;
  } else {
    quality = 'Poor';
    bars = 1;
    snr = 9;
  }

  return {
    dBm,
    quality,
    bars,
    frequencyOrBand: band,
    secondaryMetric: `SNR ${snr} dB`,
    technology: 'Wi-Fi 6 (802.11ax)',
  };
}

export function evaluateCellularSignal(
  dBm: number,
  band: string = '5G n77 C-Band',
  isSim2: boolean = false
): SignalMetrics {
  let quality: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Good';
  let bars = 3;
  let rsrq = -11;
  let sinr = 16;

  if (dBm >= -80) {
    quality = 'Excellent';
    bars = 4;
    rsrq = -8;
    sinr = 24;
  } else if (dBm >= -92) {
    quality = 'Good';
    bars = 3;
    rsrq = -12;
    sinr = 15;
  } else if (dBm >= -105) {
    quality = 'Fair';
    bars = 2;
    rsrq = -15;
    sinr = 6;
  } else {
    quality = 'Poor';
    bars = 1;
    rsrq = -19;
    sinr = -2;
  }

  return {
    dBm,
    quality,
    bars,
    frequencyOrBand: band,
    secondaryMetric: `RSRQ ${rsrq} dB · SINR ${sinr} dB`,
    technology: isSim2 ? '4G LTE-Advanced' : '5G Ultra Wideband (NR)',
  };
}

export function getSignalColorClass(quality: 'Excellent' | 'Good' | 'Fair' | 'Poor') {
  switch (quality) {
    case 'Excellent':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500',
        border: 'border-emerald-500/40',
        badgeBg: 'bg-emerald-950/80',
      };
    case 'Good':
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500',
        border: 'border-cyan-500/40',
        badgeBg: 'bg-cyan-950/80',
      };
    case 'Fair':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500',
        border: 'border-amber-500/40',
        badgeBg: 'bg-amber-950/80',
      };
    case 'Poor':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500',
        border: 'border-rose-500/40',
        badgeBg: 'bg-rose-950/80',
      };
  }
}
