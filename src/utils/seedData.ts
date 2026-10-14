import { InterfaceConfig, AppUsageItem, DailyUsageRecord, NetworkAlert } from '../types/network';

export const DEFAULT_INTERFACES: InterfaceConfig[] = [
  {
    id: 'wifi',
    name: 'Office Fiber 5GHz',
    carrierOrSSID: 'SkyNet-Mesh-9021',
    monthlyCapMB: 350000, // 350 GB
    warningThresholdPercent: 80,
    billingCycleStartDay: 1,
    overageCostPerGB: 10,
    planCost: 65,
    currency: '$',
    isUnlimited: false,
    color: '#06b6d4', // cyan-500
    accentColor: 'cyan',
    signalDbm: -52, // Excellent (-30 to -50) / Very Good
    frequencyOrBand: '5.0 GHz (Ch 44 · 80 MHz)',
  },
  {
    id: 'sim1',
    name: 'Verizon 5G Ultra (SIM 1)',
    carrierOrSSID: 'Verizon Wireless · eSIM',
    monthlyCapMB: 25000, // 25 GB
    warningThresholdPercent: 80,
    billingCycleStartDay: 1,
    overageCostPerGB: 15,
    planCost: 55,
    currency: '$',
    isUnlimited: false,
    color: '#10b981', // emerald-500
    accentColor: 'emerald',
    signalDbm: -78, // Good RSRP (-70 to -85 dBm)
    frequencyOrBand: '5G NR n77 (3.7 GHz C-Band)',
  },
  {
    id: 'sim2',
    name: 'Airalo Global Roam (SIM 2)',
    carrierOrSSID: 'Airalo eSIM · Roaming',
    monthlyCapMB: 5000, // 5 GB
    warningThresholdPercent: 85,
    billingCycleStartDay: 10,
    overageCostPerGB: 20,
    planCost: 24,
    currency: '$',
    isUnlimited: false,
    color: '#f59e0b', // amber-500
    accentColor: 'amber',
    signalDbm: -96, // Fair/Moderate RSRP (-90 to -105 dBm)
    frequencyOrBand: '4G LTE B4 AWS (1700/2100 MHz)',
  },
];

export const INITIAL_APPS: AppUsageItem[] = [
  {
    id: 'youtube',
    name: 'YouTube & Shorts',
    category: 'Streaming',
    icon: 'Video',
    wifiBytes: 42.8 * 1024 * 1024 * 1024,
    sim1Bytes: 6.4 * 1024 * 1024 * 1024,
    sim2Bytes: 0.8 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'netflix',
    name: 'Netflix 4K HDR',
    category: 'Streaming',
    icon: 'Tv',
    wifiBytes: 58.2 * 1024 * 1024 * 1024,
    sim1Bytes: 3.1 * 1024 * 1024 * 1024,
    sim2Bytes: 0.2 * 1024 * 1024 * 1024,
    restricted: true,
    currentSpeedBytes: 0,
  },
  {
    id: 'zoom',
    name: 'Zoom & Microsoft Teams',
    category: 'Work & Dev',
    icon: 'Users',
    wifiBytes: 24.5 * 1024 * 1024 * 1024,
    sim1Bytes: 4.8 * 1024 * 1024 * 1024,
    sim2Bytes: 1.1 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'chrome',
    name: 'Google Chrome Browser',
    category: 'Work & Dev',
    icon: 'Globe',
    wifiBytes: 18.6 * 1024 * 1024 * 1024,
    sim1Bytes: 2.9 * 1024 * 1024 * 1024,
    sim2Bytes: 0.7 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'instagram',
    name: 'Instagram & Reels',
    category: 'Social',
    icon: 'Camera',
    wifiBytes: 14.2 * 1024 * 1024 * 1024,
    sim1Bytes: 3.8 * 1024 * 1024 * 1024,
    sim2Bytes: 0.6 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'gdrive',
    name: 'Google Drive & Cloud Sync',
    category: 'Cloud & Sync',
    icon: 'Cloud',
    wifiBytes: 36.1 * 1024 * 1024 * 1024,
    sim1Bytes: 1.2 * 1024 * 1024 * 1024,
    sim2Bytes: 0.1 * 1024 * 1024 * 1024,
    restricted: true,
    currentSpeedBytes: 0,
  },
  {
    id: 'spotify',
    name: 'Spotify Hi-Fi',
    category: 'Streaming',
    icon: 'Headphones',
    wifiBytes: 8.7 * 1024 * 1024 * 1024,
    sim1Bytes: 1.8 * 1024 * 1024 * 1024,
    sim2Bytes: 0.4 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'steam',
    name: 'Steam Client & Gaming',
    category: 'Gaming',
    icon: 'Gamepad2',
    wifiBytes: 44.0 * 1024 * 1024 * 1024,
    sim1Bytes: 0.4 * 1024 * 1024 * 1024,
    sim2Bytes: 0.05 * 1024 * 1024 * 1024,
    restricted: true,
    currentSpeedBytes: 0,
  },
  {
    id: 'github',
    name: 'GitHub Desktop & Git Push',
    category: 'Work & Dev',
    icon: 'GitBranch',
    wifiBytes: 12.3 * 1024 * 1024 * 1024,
    sim1Bytes: 1.6 * 1024 * 1024 * 1024,
    sim2Bytes: 0.3 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'system',
    name: 'OS System Updates & Telemetry',
    category: 'System',
    icon: 'Cpu',
    wifiBytes: 9.8 * 1024 * 1024 * 1024,
    sim1Bytes: 0.3 * 1024 * 1024 * 1024,
    sim2Bytes: 0.05 * 1024 * 1024 * 1024,
    restricted: true,
    currentSpeedBytes: 0,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp & Telegram',
    category: 'Social',
    icon: 'MessageSquare',
    wifiBytes: 6.4 * 1024 * 1024 * 1024,
    sim1Bytes: 1.4 * 1024 * 1024 * 1024,
    sim2Bytes: 0.5 * 1024 * 1024 * 1024,
    restricted: false,
    currentSpeedBytes: 0,
  },
  {
    id: 'docker',
    name: 'Docker Engine Pulls',
    category: 'Work & Dev',
    icon: 'Box',
    wifiBytes: 22.1 * 1024 * 1024 * 1024,
    sim1Bytes: 0.2 * 1024 * 1024 * 1024,
    sim2Bytes: 0.02 * 1024 * 1024 * 1024,
    restricted: true,
    currentSpeedBytes: 0,
  },
];

/**
 * Generates realistic 90 days of history for October 2026 and prior months
 */
export function generateSeedDailyRecords(): DailyUsageRecord[] {
  const records: DailyUsageRecord[] = [];
  const today = new Date(2026, 9, 13); // Oct 13, 2026

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    
    // Seed Wi-Fi: typically 6 - 18 GB/day
    const wifiBase = isWeekend ? 14 : 9;
    const wifiVariation = (Math.sin(i * 1.3) + 1.1) * 3.5;
    const wifiMB = (wifiBase + wifiVariation) * 1024;
    const wifiDown = wifiMB * 0.82 * 1024 * 1024;
    const wifiUp = wifiMB * 0.18 * 1024 * 1024;

    // Seed SIM 1: 500 MB - 1.8 GB / day
    const sim1Base = isWeekend ? 1.2 : 0.75;
    const sim1Variation = (Math.cos(i * 0.9) + 1.0) * 0.35;
    const sim1MB = (sim1Base + sim1Variation) * 1024;
    const sim1Down = sim1MB * 0.85 * 1024 * 1024;
    const sim1Up = sim1MB * 0.15 * 1024 * 1024;

    // Seed SIM 2 (Travel roaming, lower frequency)
    const sim2MB = (i % 7 === 2 || i % 7 === 3) ? (180 + (i % 5) * 60) : (40 + (i % 3) * 20);
    const sim2Down = sim2MB * 0.88 * 1024 * 1024;
    const sim2Up = sim2MB * 0.12 * 1024 * 1024;

    records.push({
      date: dateStr,
      wifiDownBytes: Math.round(wifiDown),
      wifiUpBytes: Math.round(wifiUp),
      sim1DownBytes: Math.round(sim1Down),
      sim1UpBytes: Math.round(sim1Up),
      sim2DownBytes: Math.round(sim2Down),
      sim2UpBytes: Math.round(sim2Up),
    });
  }

  return records;
}

export const INITIAL_ALERTS: NetworkAlert[] = [
  {
    id: 'alt-1',
    timestamp: Date.now() - 1000 * 60 * 42,
    type: 'cap_warning',
    interfaceId: 'sim1',
    title: 'SIM 1 approaching monthly limit',
    message: 'SIM 1 usage reached 76.5% of the 25.0 GB plan (19.1 GB used). Recommended to switch streaming to Wi-Fi.',
    severity: 'warning',
    read: false,
    actionLabel: 'View SIM 1 Caps',
    exceededPercent: 76.5,
  },
  {
    id: 'alt-2',
    timestamp: Date.now() - 1000 * 60 * 180,
    type: 'spike_surge',
    interfaceId: 'wifi',
    title: 'High Download Surge Detected',
    message: 'Wi-Fi download rate peaked at 48.6 MB/s during cloud backup sync.',
    severity: 'info',
    read: true,
  },
];
