import React, { useState } from 'react';
import {
  X,
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  Volume2,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { NetworkAlert, NetworkInterfaceId } from '../types/network';
import { formatTimeAgo } from '../utils/formatters';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: NetworkAlert[];
  onDismissAlert: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onTriggerTestAlert: (type: 'cap_exceeded' | 'cap_warning' | 'spike_surge') => void;
  isAudioMuted: boolean;
  onToggleAudioMute: () => void;
  onSelectTab: (tab: 'dashboard' | 'reports' | 'apps' | 'settings') => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onMarkAllRead,
  onClearAll,
  onTriggerTestAlert,
  isAudioMuted,
  onToggleAudioMute,
  onSelectTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                Real-Time Usage Alerts
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-rose-600 text-white font-mono">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Cap thresholds &amp; traffic surge triggers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filter === 'critical' ? 'bg-rose-950/80 text-rose-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filter === 'warning' ? 'bg-amber-950/80 text-amber-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Warnings
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Read</span>
              </button>
            )}

            {alerts.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
                title="Clear all alerts"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Test Alert Simulator bar */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] font-medium">Test Alerts:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTriggerTestAlert('cap_exceeded')}
              className="px-2 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900 transition-colors"
            >
              Test Cap Exceeded
            </button>
            <button
              onClick={() => onTriggerTestAlert('cap_warning')}
              className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 hover:bg-amber-900 transition-colors"
            >
              Test 80% Warning
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <ShieldAlert className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-3" />
              <p className="text-sm font-medium text-slate-400">No alerts in this category</p>
              <p className="text-xs text-slate-500 mt-1">
                Data consumption is within configured cap parameters.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCrit
                      ? 'bg-rose-950/30 border-rose-800/80 text-rose-100'
                      : isWarn
                      ? 'bg-amber-950/30 border-amber-800/80 text-amber-100'
                      : 'bg-slate-950/50 border-slate-800 text-slate-200'
                  } ${!alert.read ? 'ring-1 ring-cyan-500/30 shadow-md' : 'opacity-85'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          isCrit
                            ? 'bg-rose-900/60 text-rose-400'
                            : isWarn
                            ? 'bg-amber-900/60 text-amber-400'
                            : 'bg-slate-800 text-cyan-400'
                        }`}
                      >
                        {isCrit ? (
                          <AlertOctagon className="w-4 h-4" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-white">{alert.title}</h4>
                          {!alert.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {alert.message}
                        </p>

                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="font-mono">{formatTimeAgo(alert.timestamp)}</span>
                          <span>·</span>
                          <span className="uppercase font-mono text-[10px] tracking-wider px-1.5 py-0.2 rounded bg-black/40 border border-slate-800">
                            {alert.interfaceId.toUpperCase()}
                          </span>

                          {alert.actionLabel && (
                            <>
                              <span>·</span>
                              <button
                                onClick={() => {
                                  onClose();
                                  onSelectTab('settings');
                                }}
                                className="text-cyan-400 hover:underline font-medium"
                              >
                                {alert.actionLabel}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-slate-500 hover:text-slate-300 p-1"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-center text-[11px] text-slate-500">
          Threshold alerts auto-trigger when usage reaches 80% and 100% of plan limits.
        </div>
      </div>
    </div>
  );
};
