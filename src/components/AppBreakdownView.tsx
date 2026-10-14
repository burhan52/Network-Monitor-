import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ArrowUpDown,
  Video,
  Tv,
  Users,
  Globe,
  Camera,
  Cloud,
  Headphones,
  Gamepad2,
  GitBranch,
  Cpu,
  MessageSquare,
  Box,
  Wifi,
  Smartphone,
  Activity,
} from 'lucide-react';
import { AppUsageItem, NetworkInterfaceId } from '../types/network';
import { formatBytes, formatSpeed } from '../utils/formatters';

interface AppBreakdownViewProps {
  apps: AppUsageItem[];
  onToggleRestriction: (appId: string) => void;
  activeInterface: NetworkInterfaceId;
}

// Icon mapper helper
const getAppIcon = (iconName: string) => {
  switch (iconName) {
    case 'Video':
      return <Video className="w-4 h-4 text-rose-400" />;
    case 'Tv':
      return <Tv className="w-4 h-4 text-red-500" />;
    case 'Users':
      return <Users className="w-4 h-4 text-blue-400" />;
    case 'Globe':
      return <Globe className="w-4 h-4 text-amber-400" />;
    case 'Camera':
      return <Camera className="w-4 h-4 text-pink-400" />;
    case 'Cloud':
      return <Cloud className="w-4 h-4 text-sky-400" />;
    case 'Headphones':
      return <Headphones className="w-4 h-4 text-emerald-400" />;
    case 'Gamepad2':
      return <Gamepad2 className="w-4 h-4 text-purple-400" />;
    case 'GitBranch':
      return <GitBranch className="w-4 h-4 text-slate-300" />;
    case 'Cpu':
      return <Cpu className="w-4 h-4 text-slate-400" />;
    case 'MessageSquare':
      return <MessageSquare className="w-4 h-4 text-teal-400" />;
    case 'Box':
      return <Box className="w-4 h-4 text-cyan-400" />;
    default:
      return <Activity className="w-4 h-4 text-slate-400" />;
  }
};

export const AppBreakdownView: React.FC<AppBreakdownViewProps> = ({
  apps,
  onToggleRestriction,
  activeInterface,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedInterface, setSelectedInterface] = useState<'all' | 'wifi' | 'sim1' | 'sim2'>('all');
  const [sortBy, setSortBy] = useState<'total' | 'cellular' | 'wifi' | 'speed'>('total');

  const categories = ['All', 'Streaming', 'Work & Dev', 'Social', 'Cloud & Sync', 'Gaming', 'System'];

  // Filter & sort apps
  const filteredApps = useMemo(() => {
    return apps
      .filter((app) => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'All' || app.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        const aCellular = a.sim1Bytes + a.sim2Bytes;
        const bCellular = b.sim1Bytes + b.sim2Bytes;
        const aTotal = a.wifiBytes + aCellular;
        const bTotal = b.wifiBytes + bCellular;

        if (sortBy === 'cellular') return bCellular - aCellular;
        if (sortBy === 'wifi') return b.wifiBytes - a.wifiBytes;
        if (sortBy === 'speed') return b.currentSpeedBytes - a.currentSpeedBytes;
        return bTotal - aTotal;
      });
  }, [apps, searchQuery, selectedCategory, sortBy]);

  // Compute highest app usage for comparative scale
  const maxAppBytes = useMemo(() => {
    return Math.max(
      ...apps.map((a) => a.wifiBytes + a.sim1Bytes + a.sim2Bytes),
      1024 * 1024 * 1024
    );
  }, [apps]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Application Usage &amp; Data Saver</h2>
            <p className="text-xs text-slate-400 mt-1">
              Per-app consumption tracking with granular cellular background restriction.
            </p>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search application..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Filter Badges & Sort Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'total' | 'cellular' | 'wifi' | 'speed')}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="total">Total Bandwidth</option>
              <option value="cellular">Cellular Data Only</option>
              <option value="wifi">Wi-Fi Data Only</option>
              <option value="speed">Active Live Speed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>Application Name</span>
            <span className="text-slate-600">·</span>
            <span>{filteredApps.length} tracked items</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-cyan-400">
              <Wifi className="w-3 h-3" /> Wi-Fi
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Smartphone className="w-3 h-3" /> SIM 1
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Smartphone className="w-3 h-3" /> SIM 2
            </span>
            <span className="text-slate-400">Data Saver</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {filteredApps.map((app) => {
            const cellularTotal = app.sim1Bytes + app.sim2Bytes;
            const appTotal = app.wifiBytes + cellularTotal;
            const barWidthPct = Math.min(100, (appTotal / maxAppBytes) * 100);

            const wifiRatio = appTotal > 0 ? (app.wifiBytes / appTotal) * 100 : 0;
            const sim1Ratio = appTotal > 0 ? (app.sim1Bytes / appTotal) * 100 : 0;
            const sim2Ratio = appTotal > 0 ? (app.sim2Bytes / appTotal) * 100 : 0;

            const isLiveActive = app.currentSpeedBytes > 1024 * 10;

            return (
              <div
                key={app.id}
                className="p-4 hover:bg-slate-950/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* App identification */}
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-white">{app.name}</h4>
                      {isLiveActive && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800 animate-pulse">
                          {formatSpeed(app.currentSpeedBytes)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{app.category}</span>
                      {app.restricted && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-amber-400 text-[11px] font-mono">
                            Cellular Throttled
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meter and visual distribution */}
                <div className="flex-1 max-w-md mx-0 sm:mx-4">
                  <div className="flex items-baseline justify-between text-xs font-mono mb-1.5">
                    <span className="font-bold text-white">{formatBytes(appTotal)}</span>
                    <span className="text-[11px] text-slate-400">
                      Cellular: <span className="text-emerald-400">{formatBytes(cellularTotal)}</span>
                    </span>
                  </div>

                  {/* Segmented bar for this app */}
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${wifiRatio}%` }}
                      title={`Wi-Fi: ${formatBytes(app.wifiBytes)}`}
                    />
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${sim1Ratio}%` }}
                      title={`SIM 1: ${formatBytes(app.sim1Bytes)}`}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${sim2Ratio}%` }}
                      title={`SIM 2: ${formatBytes(app.sim2Bytes)}`}
                    />
                  </div>
                </div>

                {/* Submetrics & Data Saver restriction button */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right font-mono text-xs hidden sm:block">
                    <div className="text-cyan-400 text-[11px]">Wi-Fi: {formatBytes(app.wifiBytes, 1)}</div>
                    <div className="text-emerald-400 text-[11px]">SIM 1: {formatBytes(app.sim1Bytes, 1)}</div>
                  </div>

                  <button
                    onClick={() => onToggleRestriction(app.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      app.restricted
                        ? 'bg-amber-950/80 border-amber-600/70 text-amber-200 hover:bg-amber-900'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                    title={
                      app.restricted
                        ? 'Cellular background data is restricted'
                        : 'Allow full cellular background data'
                    }
                  >
                    {app.restricted ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{app.restricted ? 'Restricted' : 'Allow All'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
