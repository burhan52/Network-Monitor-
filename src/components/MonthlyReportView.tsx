import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Wifi,
  Smartphone,
  ChevronDown,
  Printer,
  PieChart,
  BarChart3,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { DailyUsageRecord, InterfaceConfig, AppUsageItem } from '../types/network';
import { formatBytes, mbToBytes } from '../utils/formatters';

interface MonthlyReportViewProps {
  dailyRecords: DailyUsageRecord[];
  interfaces: InterfaceConfig[];
  apps: AppUsageItem[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  dailyRecords,
  interfaces,
  apps,
}) => {
  // Available months
  const availableMonths = [
    { label: 'October 2026 (Current)', year: 2026, month: 9, key: '2026-10' },
    { label: 'September 2026', year: 2026, month: 8, key: '2026-09' },
    { label: 'August 2026', year: 2026, month: 7, key: '2026-08' },
  ];

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');
  const [hoveredDayRecord, setHoveredDayRecord] = useState<DailyUsageRecord | null>(null);

  // Filter records for selected month
  const monthRecords = useMemo(() => {
    return dailyRecords.filter((r) => r.date.startsWith(selectedMonthKey));
  }, [dailyRecords, selectedMonthKey]);

  // Aggregate monthly totals
  const totals = useMemo(() => {
    let wifiDown = 0;
    let wifiUp = 0;
    let sim1Down = 0;
    let sim1Up = 0;
    let sim2Down = 0;
    let sim2Up = 0;

    let peakRecord: DailyUsageRecord | null = null;
    let peakTotal = 0;

    for (const r of monthRecords) {
      wifiDown += r.wifiDownBytes;
      wifiUp += r.wifiUpBytes;
      sim1Down += r.sim1DownBytes;
      sim1Up += r.sim1UpBytes;
      sim2Down += r.sim2DownBytes;
      sim2Up += r.sim2UpBytes;

      const dayTotal =
        r.wifiDownBytes +
        r.wifiUpBytes +
        r.sim1DownBytes +
        r.sim1UpBytes +
        r.sim2DownBytes +
        r.sim2UpBytes;
      if (dayTotal > peakTotal) {
        peakTotal = dayTotal;
        peakRecord = r;
      }
    }

    const wifiTotal = wifiDown + wifiUp;
    const sim1Total = sim1Down + sim1Up;
    const sim2Total = sim2Down + sim2Up;
    const cellularTotal = sim1Total + sim2Total;
    const grandTotal = wifiTotal + cellularTotal;

    const daysCount = Math.max(1, monthRecords.length);
    const dailyAverage = grandTotal / daysCount;

    return {
      wifiDown,
      wifiUp,
      wifiTotal,
      sim1Down,
      sim1Up,
      sim1Total,
      sim2Down,
      sim2Up,
      sim2Total,
      cellularTotal,
      grandTotal,
      daysCount,
      dailyAverage,
      peakRecord,
      peakTotal,
    };
  }, [monthRecords]);

  // Estimate bill & overage fees
  const billingSummary = useMemo(() => {
    return interfaces.map((iface) => {
      let usageBytes = 0;
      if (iface.id === 'wifi') usageBytes = totals.wifiTotal;
      if (iface.id === 'sim1') usageBytes = totals.sim1Total;
      if (iface.id === 'sim2') usageBytes = totals.sim2Total;

      const capBytes = mbToBytes(iface.monthlyCapMB);
      const isExceeded = !iface.isUnlimited && usageBytes > capBytes;
      const overageBytes = isExceeded ? usageBytes - capBytes : 0;
      const overageGB = overageBytes / (1024 * 1024 * 1024);
      const overageFee = overageGB * iface.overageCostPerGB;
      const totalCost = iface.planCost + overageFee;

      return {
        iface,
        usageBytes,
        capBytes,
        isExceeded,
        overageGB,
        overageFee,
        totalCost,
      };
    });
  }, [interfaces, totals]);

  const totalMonthlyCost = billingSummary.reduce((acc, curr) => acc + curr.totalCost, 0);

  // App breakdown for this month
  const sortedApps = useMemo(() => {
    return [...apps].sort(
      (a, b) =>
        b.wifiBytes + b.sim1Bytes + b.sim2Bytes - (a.wifiBytes + a.sim1Bytes + a.sim2Bytes)
    );
  }, [apps]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Wi-Fi Download (Bytes)',
      'Wi-Fi Upload (Bytes)',
      'Wi-Fi Total (GB)',
      'SIM 1 Download (Bytes)',
      'SIM 1 Upload (Bytes)',
      'SIM 1 Total (GB)',
      'SIM 2 Download (Bytes)',
      'SIM 2 Upload (Bytes)',
      'SIM 2 Total (GB)',
      'Daily Grand Total (GB)',
    ];

    const rows = monthRecords.map((r) => {
      const wifiGB = ((r.wifiDownBytes + r.wifiUpBytes) / (1024 ** 3)).toFixed(3);
      const sim1GB = ((r.sim1DownBytes + r.sim1UpBytes) / (1024 ** 3)).toFixed(3);
      const sim2GB = ((r.sim2DownBytes + r.sim2UpBytes) / (1024 ** 3)).toFixed(3);
      const grandGB = (
        (r.wifiDownBytes +
          r.wifiUpBytes +
          r.sim1DownBytes +
          r.sim1UpBytes +
          r.sim2DownBytes +
          r.sim2UpBytes) /
        (1024 ** 3)
      ).toFixed(3);

      return [
        r.date,
        r.wifiDownBytes,
        r.wifiUpBytes,
        wifiGB,
        r.sim1DownBytes,
        r.sim1UpBytes,
        sim1GB,
        r.sim2DownBytes,
        r.sim2UpBytes,
        sim2GB,
        grandGB,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NetPulse_Usage_Report_${selectedMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Max daily usage in this month for scaling bars
  const maxDayTotal = useMemo(() => {
    const max = Math.max(
      ...monthRecords.map(
        (r) =>
          r.wifiDownBytes +
          r.wifiUpBytes +
          r.sim1DownBytes +
          r.sim1UpBytes +
          r.sim2DownBytes +
          r.sim2UpBytes
      ),
      1024 * 1024 * 1024
    );
    return max;
  }, [monthRecords]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Monthly Usage Report</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Audited
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical bandwidth distribution, billing estimates, and overage analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month selector */}
          <div className="relative">
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consumed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Total Bandwidth</span>
            <span className="text-[11px] text-slate-500 font-mono">{totals.daysCount} days</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatBytes(totals.grandTotal)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>Avg: {formatBytes(totals.dailyAverage)}/day</span>
            <span className="text-cyan-400">
              {((totals.wifiTotal / Math.max(1, totals.grandTotal)) * 100).toFixed(0)}% Wi-Fi
            </span>
          </div>
        </div>

        {/* Cellular (SIM 1 + SIM 2) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Cellular Data (SIM)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {((totals.cellularTotal / Math.max(1, totals.grandTotal)) * 100).toFixed(1)}% Share
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatBytes(totals.cellularTotal)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>SIM 1: {formatBytes(totals.sim1Total)}</span>
            <span>SIM 2: {formatBytes(totals.sim2Total)}</span>
          </div>
        </div>

        {/* Wi-Fi Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              Wi-Fi Offload
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {((totals.wifiTotal / Math.max(1, totals.grandTotal)) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {formatBytes(totals.wifiTotal)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>↓ {formatBytes(totals.wifiDown, 1)}</span>
            <span>↑ {formatBytes(totals.wifiUp, 1)}</span>
          </div>
        </div>

        {/* Estimated Monthly Invoice */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Estimated Bill
            </span>
            <span className="text-[11px] text-amber-400 font-mono">All Plans</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            ${totalMonthlyCost.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>Base: ${interfaces.reduce((a, b) => a + b.planCost, 0)}</span>
            <span
              className={
                totalMonthlyCost > interfaces.reduce((a, b) => a + b.planCost, 0)
                  ? 'text-rose-400 font-semibold'
                  : 'text-emerald-400'
              }
            >
              Overage: $
              {(
                totalMonthlyCost - interfaces.reduce((a, b) => a + b.planCost, 0)
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Day-by-Day Stacked Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Daily Bandwidth Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Interactive timeline comparing Wi-Fi vs SIM 1 vs SIM 2 for each calendar day.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
              Wi-Fi
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              SIM 1
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              SIM 2
            </span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="h-56 flex items-end gap-1 sm:gap-2 px-1">
            {monthRecords.map((r) => {
              const wifiBytes = r.wifiDownBytes + r.wifiUpBytes;
              const sim1Bytes = r.sim1DownBytes + r.sim1UpBytes;
              const sim2Bytes = r.sim2DownBytes + r.sim2UpBytes;
              const dayTotal = wifiBytes + sim1Bytes + sim2Bytes;

              const totalHeightPct = Math.min(100, (dayTotal / maxDayTotal) * 100);
              const wifiHeightPct = dayTotal > 0 ? (wifiBytes / dayTotal) * totalHeightPct : 0;
              const sim1HeightPct = dayTotal > 0 ? (sim1Bytes / dayTotal) * totalHeightPct : 0;
              const sim2HeightPct = dayTotal > 0 ? (sim2Bytes / dayTotal) * totalHeightPct : 0;

              const dayNumber = r.date.split('-')[2];
              const isHovered = hoveredDayRecord?.date === r.date;
              const isPeak = totals.peakRecord?.date === r.date;

              return (
                <div
                  key={r.date}
                  onMouseEnter={() => setHoveredDayRecord(r)}
                  onMouseLeave={() => setHoveredDayRecord(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 z-30 p-2.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-[11px] font-mono min-w-[170px] pointer-events-none">
                      <div className="font-bold text-white mb-1 border-b border-slate-800 pb-1 font-sans flex items-center justify-between">
                        <span>{r.date}</span>
                        {isPeak && <span className="text-amber-400 text-[10px]">Peak Day</span>}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-cyan-400">
                          <span>Wi-Fi:</span>
                          <span>{formatBytes(wifiBytes)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>SIM 1:</span>
                          <span>{formatBytes(sim1Bytes)}</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                          <span>SIM 2:</span>
                          <span>{formatBytes(sim2Bytes)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                          <span>Total:</span>
                          <span>{formatBytes(dayTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stacked bar */}
                  <div
                    className={`w-full max-w-[24px] rounded-t-sm flex flex-col justify-end transition-all ${
                      isHovered ? 'ring-2 ring-white scale-105' : ''
                    } ${isPeak ? 'ring-1 ring-amber-400' : ''}`}
                    style={{ height: `${Math.max(4, totalHeightPct)}%` }}
                  >
                    {/* SIM 2 segment (top) */}
                    <div
                      className="w-full bg-amber-500 rounded-t-xs"
                      style={{ height: `${(sim2Bytes / Math.max(1, dayTotal)) * 100}%` }}
                    />
                    {/* SIM 1 segment (middle) */}
                    <div
                      className="w-full bg-emerald-500"
                      style={{ height: `${(sim1Bytes / Math.max(1, dayTotal)) * 100}%` }}
                    />
                    {/* Wi-Fi segment (bottom) */}
                    <div
                      className="w-full bg-cyan-500"
                      style={{ height: `${(wifiBytes / Math.max(1, dayTotal)) * 100}%` }}
                    />
                  </div>

                  {/* Day label */}
                  <span
                    className={`text-[9px] sm:text-[10px] mt-1.5 font-mono ${
                      isHovered
                        ? 'text-cyan-300 font-bold'
                        : isPeak
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {dayNumber}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Peak info banner */}
          {totals.peakRecord && (
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Peak day: <strong className="text-white">{totals.peakRecord.date}</strong> (
                {formatBytes(totals.peakTotal)} transferred)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Hover any column to inspect Wi-Fi vs SIM breakdown
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Billing & Plan Audit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Breakdown Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Plan Billing &amp; Overage Audit
              </h3>
              <p className="text-xs text-slate-400">
                Detailed billing comparison against provisioned caps.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Cycle day: 1st
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans">
                  <th className="pb-2.5 font-medium">Interface / Carrier</th>
                  <th className="pb-2.5 font-medium">Monthly Cap</th>
                  <th className="pb-2.5 font-medium">Total Consumed</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium text-right">Overage Cost</th>
                  <th className="pb-2.5 font-medium text-right">Est. Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {billingSummary.map((item) => (
                  <tr key={item.iface.id} className="hover:bg-slate-950/40">
                    <td className="py-3 font-sans font-medium text-white flex items-center gap-2">
                      {item.iface.id === 'wifi' ? (
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{item.iface.name}</span>
                    </td>
                    <td className="py-3 text-slate-300">
                      {item.iface.isUnlimited ? 'Unlimited' : `${item.iface.monthlyCapMB / 1024} GB`}
                    </td>
                    <td className="py-3 text-white font-bold">{formatBytes(item.usageBytes)}</td>
                    <td className="py-3">
                      {item.isExceeded ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px]">
                          +{(item.overageGB).toFixed(2)} GB Exceeded
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                          Within Cap
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right text-rose-400">
                      {item.overageFee > 0
                        ? `${item.iface.currency}${item.overageFee.toFixed(2)}`
                        : '$0.00'}
                    </td>
                    <td className="py-3 text-right font-bold text-white">
                      {item.iface.currency}
                      {item.totalCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700 font-bold text-white">
                  <td colSpan={5} className="pt-3 font-sans">
                    Estimated Combined Monthly Invoice:
                  </td>
                  <td className="pt-3 text-right text-sm font-mono text-emerald-400">
                    ${totalMonthlyCost.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Peak Times & Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-cyan-400" />
              Diurnal Usage Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">Bandwidth consumption by time of day.</p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Evening Peak (18:00 - 23:00)</span>
                  <span className="font-mono text-cyan-400">46.2%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '46.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Afternoon Work (12:00 - 18:00)</span>
                  <span className="font-mono text-emerald-400">31.4%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '31.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Morning Commute (06:00 - 12:00)</span>
                  <span className="font-mono text-amber-400">14.8%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '14.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Night Sync &amp; Idle (23:00 - 06:00)</span>
                  <span className="font-mono text-indigo-400">7.6%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '7.6%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span className="font-medium text-slate-300 block mb-1">Recommendation:</span>
            Schedule heavy backups and 4K downloads during off-peak hours or on Wi-Fi to avoid
            SIM overages.
          </div>
        </div>
      </div>
    </div>
  );
};
