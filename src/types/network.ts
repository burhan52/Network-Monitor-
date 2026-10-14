export type NetworkInterfaceId = 'wifi' | 'sim1' | 'sim2';

export interface SignalMetrics {
  dBm: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  bars: number;
  frequencyOrBand: string;
  secondaryMetric: string;
  technology: string;
}

export interface InterfaceConfig {
  id: NetworkInterfaceId;
  name: string;
  carrierOrSSID: string;
  monthlyCapMB: number; // e.g. 30000 MB = 30 GB
  warningThresholdPercent: number; // e.g. 80 for 80%
  billingCycleStartDay: number; // 1 to 28
  overageCostPerGB: number; // e.g. 10.00 ($/GB)
  planCost: number; // e.g. $45/mo
  currency: string; // e.g. '$'
  isUnlimited: boolean;
  color: string;
  accentColor: string;
  signalDbm: number; // in dBm, e.g. -54 for Wi-Fi, -78 for SIM 1, -96 for SIM 2
  frequencyOrBand: string; // e.g. '5.0 GHz (Ch 44, 80MHz)' or '5G NR n77 (3.7GHz)'
}

export interface AppUsageItem {
  id: string;
  name: string;
  category: 'Streaming' | 'Social' | 'Cloud & Sync' | 'Work & Dev' | 'Gaming' | 'System' | 'Downloads';
  icon: string;
  wifiBytes: number;
  sim1Bytes: number;
  sim2Bytes: number;
  restricted: boolean; // Data saver restricted
  currentSpeedBytes: number; // Live current speed
  packageId?: string;
}

export interface DailyUsageRecord {
  date: string; // YYYY-MM-DD
  wifiDownBytes: number;
  wifiUpBytes: number;
  sim1DownBytes: number;
  sim1UpBytes: number;
  sim2DownBytes: number;
  sim2UpBytes: number;
}

export interface SpeedSample {
  timestamp: number;
  downloadBytesPerSec: number;
  uploadBytesPerSec: number;
  interfaceId: NetworkInterfaceId;
}

export interface NetworkAlert {
  id: string;
  timestamp: number;
  type: 'cap_exceeded' | 'cap_warning' | 'spike_surge' | 'daily_budget' | 'roaming';
  interfaceId: NetworkInterfaceId;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  read: boolean;
  actionLabel?: string;
  exceededPercent?: number;
}

export type TrafficPreset = 'idle' | 'light' | 'streaming_4k' | 'cloud_sync' | 'torrent_surge';

export interface BrowserNetworkInfo {
  supported: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mb/s
  rtt?: number; // ms
  saveData?: boolean;
}

export interface WifiConnectedDevice {
  id: string;
  name: string;
  type: 'workstation' | 'laptop' | 'mobile' | 'smart_tv' | 'nas' | 'gaming' | 'iot';
  ipAddress: string;
  macAddress: string;
  band: '5 GHz' | '2.4 GHz' | '6 GHz' | 'Gigabit LAN';
  signalDbm: number; // e.g. -52 dBm
  linkSpeedMbps: number; // e.g. 1201 Mbps
  currentSpeedBytes: number;
  totalBytesToday: number;
  isThisDevice: boolean;
  isQosPrioritized: boolean;
  connectedToNode: 'Gateway Router' | 'Office Mesh Node';
}

