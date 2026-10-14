import React, { useState, useMemo } from 'react';
import {
  Wifi,
  Globe,
  Router,
  Laptop,
  Smartphone,
  Tv,
  HardDrive,
  Gamepad2,
  Radio,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Activity,
  Maximize2,
  Share2,
} from 'lucide-react';
import { WifiConnectedDevice, InterfaceConfig, NetworkInterfaceId } from '../types/network';
import { formatBytes, formatSpeed } from '../utils/formatters';
import { SignalBars } from './SignalBars';

interface WifiTopologyMapProps {
  wifiConfig: InterfaceConfig;
  activeInterface: NetworkInterfaceId;
  setActiveInterface: (id: NetworkInterfaceId) => void;
  currentDownSpeed: number;
  currentUpSpeed: number;
}

const DEFAULT_CONNECTED_DEVICES: WifiConnectedDevice[] = [
  {
    id: 'dev-1',
    name: 'Workstation Host (This Device)',
    type: 'workstation',
    ipAddress: '192.168.1.105',
    macAddress: 'E8:48:B8:24:90:1C',
    band: '5 GHz',
    signalDbm: -52,
    linkSpeedMbps: 1201,
    currentSpeedBytes: 0, // dynamically populated from current speed
    totalBytesToday: 14.8 * 1024 * 1024 * 1024,
    isThisDevice: true,
    isQosPrioritized: true,
    connectedToNode: 'Gateway Router',
  },
  {
    id: 'dev-2',
    name: 'MacBook Pro M3 Max',
    type: 'laptop',
    ipAddress: '192.168.1.112',
    macAddress: '3C:06:30:4A:88:FE',
    band: '5 GHz',
    signalDbm: -58,
    linkSpeedMbps: 866,
    currentSpeedBytes: 1.4 * 1024 * 1024,
    totalBytesToday: 6.2 * 1024 * 1024 * 1024,
    isThisDevice: false,
    isQosPrioritized: true,
    connectedToNode: 'Gateway Router',
  },
  {
    id: 'dev-3',
    name: 'Pixel 9 Pro Fold',
    type: 'mobile',
    ipAddress: '192.168.1.118',
    macAddress: 'F4:F5:D8:12:33:AA',
    band: '5 GHz',
    signalDbm: -62,
    linkSpeedMbps: 720,
    currentSpeedBytes: 420 * 1024,
    totalBytesToday: 3.1 * 1024 * 1024 * 1024,
    isThisDevice: false,
    isQosPrioritized: false,
    connectedToNode: 'Office Mesh Node',
  },
  {
    id: 'dev-4',
    name: 'LG OLED 4K Smart TV',
    type: 'smart_tv',
    ipAddress: '192.168.1.140',
    macAddress: '20:3D:B2:77:E1:5B',
    band: '5 GHz',
    signalDbm: -68,
    linkSpeedMbps: 433,
    currentSpeedBytes: 8.6 * 1024 * 1024, // 4K streaming
    totalBytesToday: 28.4 * 1024 * 1024 * 1024,
    isThisDevice: false,
    isQosPrioritized: false,
    connectedToNode: 'Gateway Router',
  },
  {
    id: 'dev-5',
    name: 'Synology DiskStation NAS',
    type: 'nas',
    ipAddress: '192.168.1.50',
    macAddress: '00:11:32:9C:34:2D',
    band: 'Gigabit LAN',
    signalDbm: -30, // wired ethernet
    linkSpeedMbps: 1000,
    currentSpeedBytes: 3.2 * 1024 * 1024,
    totalBytesToday: 41.5 * 1024 * 1024 * 1024,
    isThisDevice: false,
    isQosPrioritized: true,
    connectedToNode: 'Gateway Router',
  },
  {
    id: 'dev-6',
    name: 'PlayStation 5 Console',
    type: 'gaming',
    ipAddress: '192.168.1.165',
    macAddress: '70:9E:29:43:55:01',
    band: '5 GHz',
    signalDbm: -64,
    linkSpeedMbps: 866,
    currentSpeedBytes: 120 * 1024,
    totalBytesToday: 8.9 * 1024 * 1024 * 1024,
    isThisDevice: false,
    isQosPrioritized: false,
    connectedToNode: 'Office Mesh Node',
  },
  {
    id: 'dev-7',
    name: 'Philips Hue Smart Hub',
    type: 'iot',
    ipAddress: '192.168.1.200',
    macAddress: 'EC:B5:FA:89:12:44',
    band: '2.4 GHz',
    signalDbm: -74,
    linkSpeedMbps: 54,
    currentSpeedBytes: 14 * 1024,
    totalBytesToday: 240 * 1024 * 1024,
    isThisDevice: false,
    isQosPrioritized: false,
    connectedToNode: 'Office Mesh Node',
  },
];

export const WifiTopologyMap: React.FC<WifiTopologyMapProps> = ({
  wifiConfig,
  activeInterface,
  setActiveInterface,
  currentDownSpeed,
  currentUpSpeed,
}) => {
  const isWifiActive = activeInterface === 'wifi';
  const [devices, setDevices] = useState<WifiConnectedDevice[]>(DEFAULT_CONNECTED_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-1');
  const [bandFilter, setBandFilter] = useState<'all' | '5 GHz' | '2.4 GHz' | 'Gigabit LAN'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Toggle QoS priority for a device
  const handleToggleQos = (devId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === devId ? { ...d, isQosPrioritized: !d.isQosPrioritized } : d))
    );
  };

  // Selected device details
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchBand = bandFilter === 'all' || d.band === bandFilter;
      const matchQuery =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ipAddress.includes(searchQuery) ||
        d.macAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBand && matchQuery;
    });
  }, [devices, bandFilter, searchQuery]);

  // Total active bandwidth across all connected devices
  const totalNetworkTrafficBytes = useMemo(() => {
    return devices.reduce(
      (sum, d) => sum + (d.isThisDevice ? currentDownSpeed + currentUpSpeed : d.currentSpeedBytes),
      0
    );
  }, [devices, currentDownSpeed, currentUpSpeed]);

  const getDeviceIcon = (type: WifiConnectedDevice['type']) => {
    switch (type) {
      case 'workstation':
      case 'laptop':
        return <Laptop className="w-4 h-4 text-cyan-400" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'smart_tv':
        return <Tv className="w-4 h-4 text-purple-400" />;
      case 'nas':
        return <HardDrive className="w-4 h-4 text-blue-400" />;
      case 'gaming':
        return <Gamepad2 className="w-4 h-4 text-rose-400" />;
      case 'iot':
        return <Cpu className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">
              Wi-Fi Network Topology &amp; Connected Devices
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
              LAN Map
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active WLAN client topology, mesh backhaul links, and local device inventory.
          </p>
        </div>

        {/* View Switcher & Wi-Fi Active Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isWifiActive ? (
            <button
              onClick={() => setActiveInterface('wifi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Switch to Wi-Fi to Monitor LAN</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Topology Graph
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Device List ({devices.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Network Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs font-mono">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-sans block">Gateway SSID</span>
          <span className="font-bold text-white text-xs truncate block">
            {wifiConfig.carrierOrSSID}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">192.168.1.1</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-sans block">Client Devices</span>
          <span className="font-bold text-white text-xs">
            {devices.length} Online Clients
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">6 Wireless · 1 Wired</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-sans block">Total LAN Traffic</span>
          <span className="font-bold text-white text-xs">
            {formatSpeed(totalNetworkTrafficBytes)}
          </span>
          <span className="text-[10px] text-purple-400 font-mono">Gigabit Uplink</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-sans block">Host Signal</span>
          <span className="font-bold text-cyan-300 text-xs">
            {wifiConfig.signalDbm} dBm (RSSI)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{wifiConfig.frequencyOrBand}</span>
        </div>
      </div>

      {/* Mode 1: Interactive Visual Network Topology Map */}
      {viewMode === 'map' && (
        <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800/90 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Active Infrastructure &amp; Client Node Graph
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Click any device to inspect properties
            </span>
          </div>

          {/* Topology Interactive Diagram Canvas */}
          <div className="relative w-full h-[340px] bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex items-center justify-center">
            {/* Background SVG Grid and Dynamic Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fiberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="backhaulGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* WAN to Router Path */}
              <line x1="14%" y1="50%" x2="35%" y2="50%" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="4 2" />

              {/* Gateway Router to Mesh Node Path */}
              <path d="M 35% 50% Q 42% 25% 58% 28%" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3 3" />

              {/* Gateway Router to Client Devices Lines */}
              <path d="M 35% 50% Q 55% 65% 82% 80%" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              <path d="M 35% 50% Q 55% 50% 82% 52%" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.9" />
              <path d="M 35% 50% Q 55% 38% 82% 34%" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
              <path d="M 35% 50% Q 52% 80% 82% 96%" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.8" />

              {/* Mesh Node to Client Devices Lines */}
              <path d="M 58% 28% Q 70% 12% 82% 10%" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7" />
              <path d="M 58% 28% Q 70% 20% 82% 22%" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7" />
              <path d="M 58% 28% Q 70% 30% 82% 66%" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
            </svg>

            {/* NODE 1: WAN Public Internet Node */}
            <div className="absolute left-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-600 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-900/30">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-white mt-1.5 font-mono">WAN Fiber</span>
              <span className="text-[9px] text-sky-400 font-mono">1.0 Gbps Uplink</span>
            </div>

            {/* NODE 2: SkyNet Mesh Gateway Router */}
            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-900/40 ring-4 ring-cyan-500/10">
                <Router className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold text-white mt-1.5 font-mono">Gateway Router</span>
              <span className="text-[10px] text-cyan-400 font-mono">192.168.1.1</span>
              <span className="text-[9px] text-slate-400 font-mono">Wi-Fi 6E (Ch 44)</span>
            </div>

            {/* NODE 3: Office Mesh Node */}
            <div className="absolute left-[54%] top-[16%] flex flex-col items-center z-10">
              <div className="w-11 h-11 rounded-2xl bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-900/30">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 font-mono">Mesh Satellite</span>
              <span className="text-[9px] text-purple-400 font-mono">192.168.1.254</span>
              <span className="text-[8px] text-slate-400 font-mono">5 GHz Backhaul</span>
            </div>

            {/* NODE 4: Connected Client Devices Column */}
            <div className="absolute right-[3%] top-2 bottom-2 w-[38%] max-w-[260px] flex flex-col justify-between py-1 z-10">
              {devices.map((dev) => {
                const isSelected = selectedDeviceId === dev.id;
                const speed = dev.isThisDevice
                  ? currentDownSpeed + currentUpSpeed
                  : dev.currentSpeedBytes;

                return (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDeviceId(dev.id)}
                    className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400 text-white'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-1 rounded-lg bg-slate-900 shrink-0">
                        {getDeviceIcon(dev.type)}
                      </div>
                      <div className="truncate">
                        <div className="text-[11px] font-semibold truncate flex items-center gap-1">
                          <span>{dev.name}</span>
                          {dev.isThisDevice && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {dev.ipAddress} · {dev.band}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[10px]">
                      {speed > 1024 * 10 ? (
                        <span className="text-emerald-400 font-bold block">
                          {formatSpeed(speed)}
                        </span>
                      ) : (
                        <span className="text-slate-500 block">Idle</span>
                      )}
                      <span className="text-cyan-400 text-[9px]">{dev.signalDbm} dBm</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Device Deep Inspector Tray */}
          {selectedDevice && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getDeviceIcon(selectedDevice.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-xs">{selectedDevice.name}</h4>
                      {selectedDevice.isThisDevice && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                          Host Device
                        </span>
                      )}
                      {selectedDevice.isQosPrioritized && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          QoS High Priority
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      IP: {selectedDevice.ipAddress} · MAC: {selectedDevice.macAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleQos(selectedDevice.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      selectedDevice.isQosPrioritized
                        ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {selectedDevice.isQosPrioritized ? 'Priority QoS Enabled' : 'Enable QoS Priority'}
                  </button>
                </div>
              </div>

              {/* Sub-parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Radio Link</span>
                  <span className="text-white font-medium">{selectedDevice.band}</span>
                  <span className="text-slate-400 text-[10px] block">
                    {selectedDevice.linkSpeedMbps} Mbps PHY
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Signal Level</span>
                  <div className="flex items-center gap-1.5">
                    <SignalBars
                      type="wifi"
                      dBm={selectedDevice.signalDbm}
                      showDbmText={true}
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Current Bandwidth</span>
                  <span className="text-emerald-400 font-bold">
                    {formatSpeed(
                      selectedDevice.isThisDevice
                        ? currentDownSpeed + currentUpSpeed
                        : selectedDevice.currentSpeedBytes
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Associated Node</span>
                  <span className="text-slate-200">{selectedDevice.connectedToNode}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Detailed Device Inventory Table */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Band Segmented Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['all', '5 GHz', '2.4 GHz', 'Gigabit LAN'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBandFilter(b)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    bandFilter === b
                      ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b === 'all' ? 'All Bands' : b}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search device, IP, or MAC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-sans">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Device Name</th>
                  <th className="py-2.5 px-3 font-medium">IP &amp; MAC Address</th>
                  <th className="py-2.5 px-3 font-medium">Radio Link</th>
                  <th className="py-2.5 px-3 font-medium">RSSI Signal</th>
                  <th className="py-2.5 px-3 font-medium">Live Throughput</th>
                  <th className="py-2.5 px-3 font-medium">Today's Data</th>
                  <th className="py-2.5 px-3 font-medium text-right">QoS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredDevices.map((dev) => {
                  const speed = dev.isThisDevice
                    ? currentDownSpeed + currentUpSpeed
                    : dev.currentSpeedBytes;

                  return (
                    <tr key={dev.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-slate-900">{getDeviceIcon(dev.type)}</div>
                          <div>
                            <span className="font-semibold text-white font-sans text-xs">
                              {dev.name}
                            </span>
                            {dev.isThisDevice && (
                              <span className="ml-1.5 text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                This Device
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <div>{dev.ipAddress}</div>
                        <div className="text-[10px] text-slate-500">{dev.macAddress}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <div>{dev.band}</div>
                        <div className="text-[10px] text-slate-500">{dev.linkSpeedMbps} Mbps</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <SignalBars type="wifi" dBm={dev.signalDbm} size="sm" showDbmText={true} />
                      </td>
                      <td className="py-2.5 px-3">
                        {speed > 1024 * 10 ? (
                          <span className="text-emerald-400 font-bold">{formatSpeed(speed)}</span>
                        ) : (
                          <span className="text-slate-500">Idle</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatBytes(dev.totalBytesToday)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleQos(dev.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                            dev.isQosPrioritized
                              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {dev.isQosPrioritized ? 'High' : 'Normal'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
