import { useState, useEffect, useRef, useCallback } from 'react';
import {
  NetworkInterfaceId,
  InterfaceConfig,
  AppUsageItem,
  DailyUsageRecord,
  SpeedSample,
  NetworkAlert,
  TrafficPreset,
  BrowserNetworkInfo,
} from '../types/network';
import {
  DEFAULT_INTERFACES,
  INITIAL_APPS,
  generateSeedDailyRecords,
  INITIAL_ALERTS,
} from '../utils/seedData';
import {
  playCapExceededSound,
  playCapWarningSound,
  playSpikeSurgeSound,
} from '../utils/audioAlert';
import { showDesktopNotification } from '../utils/browserNotification';
import { formatBytes, mbToBytes } from '../utils/formatters';
import { BatteryTelemetry, calculateInstantaneousDrawMa } from '../utils/battery';

const STORAGE_KEY_IFACES = 'netpulse_interfaces_v1';
const STORAGE_KEY_ACTIVE = 'netpulse_active_iface_v1';
const STORAGE_KEY_DAILY = 'netpulse_daily_records_v1';
const STORAGE_KEY_APPS = 'netpulse_apps_v1';
const STORAGE_KEY_ALERTS = 'netpulse_alerts_v1';
const STORAGE_KEY_MUTED = 'netpulse_muted_v1';
const STORAGE_KEY_DAILY_LIMIT = 'netpulse_daily_limit_mb_v1';

export function useNetworkMonitor() {
  // Interfaces state
  const [interfaces, setInterfaces] = useState<InterfaceConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_IFACES);
      if (stored) {
        const parsed: InterfaceConfig[] = JSON.parse(stored);
        return parsed.map((item) => {
          const def = DEFAULT_INTERFACES.find((d) => d.id === item.id);
          return {
            ...item,
            signalDbm: item.signalDbm ?? def?.signalDbm ?? -60,
            frequencyOrBand: item.frequencyOrBand ?? def?.frequencyOrBand ?? '',
          };
        });
      }
      return DEFAULT_INTERFACES;
    } catch {
      return DEFAULT_INTERFACES;
    }
  });

  // Active interface
  const [activeInterface, setActiveInterface] = useState<NetworkInterfaceId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
      return (stored as NetworkInterfaceId) || 'wifi';
    } catch {
      return 'wifi';
    }
  });

  // Daily records
  const [dailyRecords, setDailyRecords] = useState<DailyUsageRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DAILY);
      return stored ? JSON.parse(stored) : generateSeedDailyRecords();
    } catch {
      return generateSeedDailyRecords();
    }
  });

  // Apps usage
  const [apps, setApps] = useState<AppUsageItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_APPS);
      return stored ? JSON.parse(stored) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  // Alerts
  const [alerts, setAlerts] = useState<NetworkAlert[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALERTS);
      return stored ? JSON.parse(stored) : INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
    }
  });

  // Traffic Preset & Settings
  const [trafficPreset, setTrafficPreset] = useState<TrafficPreset>('light');
  const [isDataSaverActive, setIsDataSaverActive] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    } catch {
      return false;
    }
  });
  const [dailyWarningMB, setDailyWarningMB] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DAILY_LIMIT);
      return stored ? Number(stored) : 3000; // 3 GB / day warning
    } catch {
      return 3000;
    }
  });

  // Speed history for rolling chart (last 50 samples)
  const [speedSamples, setSpeedSamples] = useState<SpeedSample[]>(() => {
    const init: SpeedSample[] = [];
    const now = Date.now();
    for (let i = 40; i >= 0; i--) {
      init.push({
        timestamp: now - i * 1000,
        downloadBytesPerSec: 150000 + Math.random() * 80000,
        uploadBytesPerSec: 35000 + Math.random() * 20000,
        interfaceId: 'wifi',
      });
    }
    return init;
  });

  // Real browser Network Information API
  const [browserNetwork, setBrowserNetwork] = useState<BrowserNetworkInfo>({
    supported: false,
  });

  // Battery telemetry state
  const [batteryTelemetry, setBatteryTelemetry] = useState<BatteryTelemetry>({
    level: 84,
    charging: false,
    chargingTime: 0,
    dischargingTime: 18000,
    currentDrawMa: 4.8,
    accumulatedDaemonMah: 14.85,
    batteryCapacityMah: 4500,
    temperatureC: 31.4,
    powerEfficiencyMode: 'balanced',
  });

  // Keep track of alert states to prevent continuous spamming on every second
  const alertedCapsRef = useRef<{ [key: string]: boolean }>({});
  const lastSpikeAlertRef = useRef<number>(0);
  const lastDailyAlertRef = useRef<string>('');

  // Sync real device battery if supported
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    interface BatteryManagerPolyfill {
      level: number;
      charging: boolean;
      chargingTime: number;
      dischargingTime: number;
      addEventListener: (type: string, listener: () => void) => void;
      removeEventListener: (type: string, listener: () => void) => void;
    }
    const nav = navigator as unknown as { getBattery?: () => Promise<BatteryManagerPolyfill> };
    if (typeof nav.getBattery === 'function') {
      nav.getBattery().then((battery) => {
        const updateBattery = () => {
          setBatteryTelemetry((prev) => ({
            ...prev,
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime || 0,
            dischargingTime: battery.dischargingTime || 18000,
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  // Persist interfaces
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_IFACES, JSON.stringify(interfaces));
    } catch {}
  }, [interfaces]);

  // Persist active interface
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeInterface);
    } catch {}
  }, [activeInterface]);

  // Persist daily records periodically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(dailyRecords));
    } catch {}
  }, [dailyRecords]);

  // Persist apps
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));
    } catch {}
  }, [apps]);

  // Persist alerts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    } catch {}
  }, [alerts]);

  // Persist muted
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(isAudioMuted));
    } catch {}
  }, [isAudioMuted]);

  // Persist daily warning limit
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_LIMIT, String(dailyWarningMB));
    } catch {}
  }, [dailyWarningMB]);

  // Detect browser Network Information API
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    interface NetworkInfoPolyfill {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    }

    const nav = navigator as unknown as { connection?: NetworkInfoPolyfill; mozConnection?: NetworkInfoPolyfill; webkitConnection?: NetworkInfoPolyfill };
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (conn) {
      const updateConn = () => {
        setBrowserNetwork({
          supported: true,
          effectiveType: conn.effectiveType || '4g',
          downlink: conn.downlink || 10,
          rtt: conn.rtt || 30,
          saveData: conn.saveData || false,
        });
      };
      updateConn();
      if (conn.addEventListener) {
        conn.addEventListener('change', updateConn);
        return () => conn.removeEventListener?.('change', updateConn);
      }
    } else {
      setBrowserNetwork({ supported: false });
    }
  }, []);

  // Compute total usage for an interface in the current billing cycle
  const getCycleUsage = useCallback(
    (ifaceId: NetworkInterfaceId): { download: number; upload: number; total: number } => {
      const targetIface = interfaces.find((i) => i.id === ifaceId);
      const cycleStartDay = targetIface?.billingCycleStartDay || 1;

      // Current date is 2026-10-13
      const now = new Date(2026, 9, 13);
      const currentDay = now.getDate();
      
      let cycleStartDate: Date;
      if (currentDay >= cycleStartDay) {
        cycleStartDate = new Date(now.getFullYear(), now.getMonth(), cycleStartDay);
      } else {
        cycleStartDate = new Date(now.getFullYear(), now.getMonth() - 1, cycleStartDay);
      }

      let download = 0;
      let upload = 0;

      for (const rec of dailyRecords) {
        const parts = rec.date.split('-');
        const recDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (recDate >= cycleStartDate && recDate <= now) {
          if (ifaceId === 'wifi') {
            download += rec.wifiDownBytes;
            upload += rec.wifiUpBytes;
          } else if (ifaceId === 'sim1') {
            download += rec.sim1DownBytes;
            upload += rec.sim1UpBytes;
          } else if (ifaceId === 'sim2') {
            download += rec.sim2DownBytes;
            upload += rec.sim2UpBytes;
          }
        }
      }

      return { download, upload, total: download + upload };
    },
    [interfaces, dailyRecords]
  );

  // Trigger a new notification/alert
  const addAlert = useCallback(
    (alert: Omit<NetworkAlert, 'id' | 'timestamp' | 'read'>) => {
      const newAlert: NetworkAlert = {
        ...alert,
        id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        read: false,
      };

      setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);

      // Audio & Desktop notification dispatch
      if (alert.severity === 'critical') {
        playCapExceededSound(isAudioMuted);
        showDesktopNotification(`⚠️ ${alert.title}`, {
          body: alert.message,
          requireInteraction: true,
        });
      } else if (alert.severity === 'warning') {
        playCapWarningSound(isAudioMuted);
        showDesktopNotification(`🔔 ${alert.title}`, {
          body: alert.message,
        });
      } else {
        playSpikeSurgeSound(isAudioMuted);
      }
    },
    [isAudioMuted]
  );

  // Clear single alert
  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Mark all read
  const markAllAlertsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Test / manual surge injection (+X MB) to directly verify alerts
  const simulateDataSurge = useCallback(
    (megabytes: number, targetIface?: NetworkInterfaceId) => {
      const ifaceId = targetIface || activeInterface;
      const surgeBytes = megabytes * 1024 * 1024;
      const todayStr = '2026-10-13';

      // Distribute 85% down, 15% up
      const downBytes = Math.round(surgeBytes * 0.85);
      const upBytes = Math.round(surgeBytes * 0.15);

      // Add to today's record
      setDailyRecords((prev) => {
        const index = prev.findIndex((r) => r.date === todayStr);
        if (index >= 0) {
          const updated = [...prev];
          const cur = updated[index];
          if (ifaceId === 'wifi') {
            updated[index] = { ...cur, wifiDownBytes: cur.wifiDownBytes + downBytes, wifiUpBytes: cur.wifiUpBytes + upBytes };
          } else if (ifaceId === 'sim1') {
            updated[index] = { ...cur, sim1DownBytes: cur.sim1DownBytes + downBytes, sim1UpBytes: cur.sim1UpBytes + upBytes };
          } else {
            updated[index] = { ...cur, sim2DownBytes: cur.sim2DownBytes + downBytes, sim2UpBytes: cur.sim2UpBytes + upBytes };
          }
          return updated;
        } else {
          return [
            ...prev,
            {
              date: todayStr,
              wifiDownBytes: ifaceId === 'wifi' ? downBytes : 0,
              wifiUpBytes: ifaceId === 'wifi' ? upBytes : 0,
              sim1DownBytes: ifaceId === 'sim1' ? downBytes : 0,
              sim1UpBytes: ifaceId === 'sim1' ? upBytes : 0,
              sim2DownBytes: ifaceId === 'sim2' ? downBytes : 0,
              sim2UpBytes: ifaceId === 'sim2' ? upBytes : 0,
            },
          ];
        }
      });

      // Update YouTube or Download app
      setApps((prev) =>
        prev.map((app) => {
          if (app.id === 'youtube' || app.id === 'chrome') {
            const extra = Math.round(surgeBytes * 0.5);
            return {
              ...app,
              wifiBytes: ifaceId === 'wifi' ? app.wifiBytes + extra : app.wifiBytes,
              sim1Bytes: ifaceId === 'sim1' ? app.sim1Bytes + extra : app.sim1Bytes,
              sim2Bytes: ifaceId === 'sim2' ? app.sim2Bytes + extra : app.sim2Bytes,
            };
          }
          return app;
        })
      );

      // Trigger spike alert
      addAlert({
        interfaceId: ifaceId,
        type: 'spike_surge',
        title: `Spike Surge: +${megabytes} MB Downloaded`,
        message: `High-throughput surge of ${formatBytes(surgeBytes)} transferred over ${
          ifaceId === 'wifi' ? 'Wi-Fi' : ifaceId === 'sim1' ? 'SIM 1' : 'SIM 2'
        }.`,
        severity: 'warning',
      });

      // Check if this surge pushed it over cap
      const targetConfig = interfaces.find((i) => i.id === ifaceId);
      if (targetConfig && !targetConfig.isUnlimited) {
        const usage = getCycleUsage(ifaceId);
        const newTotal = usage.total + surgeBytes;
        const capBytes = mbToBytes(targetConfig.monthlyCapMB);
        const ratio = (newTotal / capBytes) * 100;

        if (ratio >= 100) {
          addAlert({
            interfaceId: ifaceId,
            type: 'cap_exceeded',
            title: `CRITICAL: ${targetConfig.name} Cap Exceeded!`,
            message: `Monthly data cap of ${targetConfig.monthlyCapMB / 1024} GB exceeded (${(
              newTotal /
              (1024 * 1024 * 1024)
            ).toFixed(2)} GB used, ${ratio.toFixed(1)}%). Overage rate: ${targetConfig.currency}${targetConfig.overageCostPerGB}/GB.`,
            severity: 'critical',
            actionLabel: 'Throttle / Restrict Data',
            exceededPercent: ratio,
          });
        }
      }
    },
    [activeInterface, interfaces, getCycleUsage, addAlert]
  );

  // Real-time ticking simulation engine (1000ms loop)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Calculate realistic speeds based on preset
      let baseDown = 0;
      let baseUp = 0;

      switch (trafficPreset) {
        case 'idle':
          baseDown = 25 * 1024 + Math.random() * 45 * 1024; // 25-70 KB/s
          baseUp = 8 * 1024 + Math.random() * 12 * 1024;
          break;
        case 'light':
          baseDown = 450 * 1024 + Math.random() * 750 * 1024; // ~450-1200 KB/s
          baseUp = 60 * 1024 + Math.random() * 90 * 1024;
          break;
        case 'streaming_4k':
          baseDown = 16 * 1024 * 1024 + Math.random() * 12 * 1024 * 1024; // 16-28 MB/s
          baseUp = 1.2 * 1024 * 1024 + Math.random() * 0.8 * 1024 * 1024;
          break;
        case 'cloud_sync':
          baseDown = 9 * 1024 * 1024 + Math.random() * 6 * 1024 * 1024;
          baseUp = 14 * 1024 * 1024 + Math.random() * 8 * 1024 * 1024;
          break;
        case 'torrent_surge':
          baseDown = 38 * 1024 * 1024 + Math.random() * 22 * 1024 * 1024; // 38-60 MB/s
          baseUp = 12 * 1024 * 1024 + Math.random() * 6 * 1024 * 1024;
          break;
      }

      // If data saver is enabled and on cellular, throttle
      if (isDataSaverActive && (activeInterface === 'sim1' || activeInterface === 'sim2')) {
        baseDown *= 0.35;
        baseUp *= 0.4;
      }

      const currentDownRate = Math.round(baseDown);
      const currentUpRate = Math.round(baseUp);

      // 2. Push sample to speed rolling window
      setSpeedSamples((prev) => {
        const next = [
          ...prev.slice(1),
          {
            timestamp: Date.now(),
            downloadBytesPerSec: currentDownRate,
            uploadBytesPerSec: currentUpRate,
            interfaceId: activeInterface,
          },
        ];
        return next;
      });

      // 3. Increment today's usage in daily records
      const todayStr = '2026-10-13';
      setDailyRecords((prev) => {
        const idx = prev.findIndex((r) => r.date === todayStr);
        if (idx >= 0) {
          const updated = [...prev];
          const row = updated[idx];
          if (activeInterface === 'wifi') {
            updated[idx] = {
              ...row,
              wifiDownBytes: row.wifiDownBytes + currentDownRate,
              wifiUpBytes: row.wifiUpBytes + currentUpRate,
            };
          } else if (activeInterface === 'sim1') {
            updated[idx] = {
              ...row,
              sim1DownBytes: row.sim1DownBytes + currentDownRate,
              sim1UpBytes: row.sim1UpBytes + currentUpRate,
            };
          } else {
            updated[idx] = {
              ...row,
              sim2DownBytes: row.sim2DownBytes + currentDownRate,
              sim2UpBytes: row.sim2UpBytes + currentUpRate,
            };
          }
          return updated;
        }
        return prev;
      });

      // 4. Distribute current rate to active apps
      setApps((prev) => {
        return prev.map((app) => {
          let appShare = 0;
          if (trafficPreset === 'streaming_4k' && (app.id === 'youtube' || app.id === 'netflix')) {
            appShare = 0.85;
          } else if (trafficPreset === 'cloud_sync' && app.id === 'gdrive') {
            appShare = 0.8;
          } else if (trafficPreset === 'torrent_surge' && (app.id === 'chrome' || app.id === 'steam')) {
            appShare = 0.7;
          } else if (app.id === 'chrome' || app.id === 'zoom') {
            appShare = 0.25;
          } else {
            appShare = 0.05;
          }

          // If restricted by data saver, cut down
          if (app.restricted && (activeInterface === 'sim1' || activeInterface === 'sim2')) {
            appShare *= 0.1;
          }

          const appDown = Math.round(currentDownRate * appShare);
          const appUp = Math.round(currentUpRate * appShare);
          const appTotal = appDown + appUp;

          return {
            ...app,
            wifiBytes: activeInterface === 'wifi' ? app.wifiBytes + appTotal : app.wifiBytes,
            sim1Bytes: activeInterface === 'sim1' ? app.sim1Bytes + appTotal : app.sim1Bytes,
            sim2Bytes: activeInterface === 'sim2' ? app.sim2Bytes + appTotal : app.sim2Bytes,
            currentSpeedBytes: appTotal,
          };
        });
      });

      // 5. Evaluate Data Caps & Alert Rules
      const curConfig = interfaces.find((i) => i.id === activeInterface);
      if (curConfig && !curConfig.isUnlimited) {
        const cycle = getCycleUsage(activeInterface);
        const capBytes = mbToBytes(curConfig.monthlyCapMB);
        const percent = (cycle.total / capBytes) * 100;

        const exceededKey = `${activeInterface}_100`;
        const warningKey = `${activeInterface}_${curConfig.warningThresholdPercent}`;

        // 100% Exceeded Alert
        if (percent >= 100 && !alertedCapsRef.current[exceededKey]) {
          alertedCapsRef.current[exceededKey] = true;
          addAlert({
            interfaceId: activeInterface,
            type: 'cap_exceeded',
            title: `CRITICAL: ${curConfig.name} Data Cap Exceeded!`,
            message: `You have consumed ${(cycle.total / (1024 * 1024 * 1024)).toFixed(
              2
            )} GB of your ${curConfig.monthlyCapMB / 1024} GB plan (${percent.toFixed(
              1
            )}%). Subsequent data may incur ${curConfig.currency}${curConfig.overageCostPerGB}/GB overage charges.`,
            severity: 'critical',
            actionLabel: 'Enable Data Saver',
            exceededPercent: percent,
          });
        }
        // Warning threshold Alert (e.g. 80%)
        else if (
          percent >= curConfig.warningThresholdPercent &&
          percent < 100 &&
          !alertedCapsRef.current[warningKey]
        ) {
          alertedCapsRef.current[warningKey] = true;
          addAlert({
            interfaceId: activeInterface,
            type: 'cap_warning',
            title: `${curConfig.name} Usage Reached ${curConfig.warningThresholdPercent}%`,
            message: `You have used ${(cycle.total / (1024 * 1024 * 1024)).toFixed(
              2
            )} GB of your ${curConfig.monthlyCapMB / 1024} GB limit (${percent.toFixed(
              1
            )}%). Consider conserving cellular data.`,
            severity: 'warning',
            exceededPercent: percent,
          });
        }
      }

      // Check sudden spike (> 28 MB/s)
      if (
        currentDownRate > 28 * 1024 * 1024 &&
        Date.now() - lastSpikeAlertRef.current > 1000 * 60 * 3
      ) {
        lastSpikeAlertRef.current = Date.now();
        addAlert({
          interfaceId: activeInterface,
          type: 'spike_surge',
          title: 'High Bandwidth Usage Spike',
          message: `Real-time download rate reached ${formatBytes(
            currentDownRate
          )}/s on ${activeInterface === 'wifi' ? 'Wi-Fi' : 'Cellular'}.`,
          severity: 'info',
        });
      }

      // Check daily budget limit
      const todayRecord = dailyRecords.find((r) => r.date === todayStr);
      if (todayRecord) {
        const todayBytes =
          activeInterface === 'wifi'
            ? todayRecord.wifiDownBytes + todayRecord.wifiUpBytes
            : activeInterface === 'sim1'
            ? todayRecord.sim1DownBytes + todayRecord.sim1UpBytes
            : todayRecord.sim2DownBytes + todayRecord.sim2UpBytes;

        const limitBytes = mbToBytes(dailyWarningMB);
        const dayKey = `${todayStr}_${activeInterface}`;
        if (todayBytes > limitBytes && lastDailyAlertRef.current !== dayKey) {
          lastDailyAlertRef.current = dayKey;
          addAlert({
            interfaceId: activeInterface,
            type: 'daily_budget',
            title: 'Daily Data Budget Exceeded',
            message: `Today's usage (${formatBytes(todayBytes)}) has exceeded your daily alert target of ${dailyWarningMB} MB.`,
            severity: 'warning',
          });
        }
      }

      // 6. Update Daemon Battery Consumption (mAh)
      const curIface = interfaces.find((i) => i.id === activeInterface);
      const drawMa = calculateInstantaneousDrawMa(
        activeInterface,
        currentDownRate + currentUpRate,
        curIface?.signalDbm ?? -60,
        batteryTelemetry.powerEfficiencyMode
      );
      const deltaMah = drawMa / 3600;

      setBatteryTelemetry((prev) => {
        const throughputMB = (currentDownRate + currentUpRate) / (1024 * 1024);
        const targetTemp = 30.5 + Math.min(5, throughputMB * 0.12);
        const smoothTemp = parseFloat((prev.temperatureC * 0.95 + targetTemp * 0.05).toFixed(1));

        return {
          ...prev,
          currentDrawMa: drawMa,
          accumulatedDaemonMah: parseFloat((prev.accumulatedDaemonMah + deltaMah).toFixed(4)),
          temperatureC: smoothTemp,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    activeInterface,
    trafficPreset,
    isDataSaverActive,
    interfaces,
    dailyRecords,
    dailyWarningMB,
    getCycleUsage,
    addAlert,
  ]);

  // Toggle app restriction
  const toggleAppRestriction = useCallback((appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, restricted: !a.restricted } : a))
    );
  }, []);

  // Update interface configuration
  const updateInterface = useCallback((updated: InterfaceConfig) => {
    setInterfaces((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    // Reset alert tracking for this interface so new thresholds can trigger
    alertedCapsRef.current[`${updated.id}_100`] = false;
    alertedCapsRef.current[`${updated.id}_${updated.warningThresholdPercent}`] = false;
  }, []);

  // Update specific signal dBm (from slider or signal tester)
  const updateSignalDbm = useCallback((ifaceId: NetworkInterfaceId, dBm: number) => {
    setInterfaces((prev) =>
      prev.map((i) => (i.id === ifaceId ? { ...i, signalDbm: Math.round(dBm) } : i))
    );
  }, []);

  // Reset all to sample defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_IFACES);
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
    localStorage.removeItem(STORAGE_KEY_DAILY);
    localStorage.removeItem(STORAGE_KEY_APPS);
    localStorage.removeItem(STORAGE_KEY_ALERTS);
    localStorage.removeItem(STORAGE_KEY_MUTED);
    localStorage.removeItem(STORAGE_KEY_DAILY_LIMIT);

    setInterfaces(DEFAULT_INTERFACES);
    setActiveInterface('wifi');
    setDailyRecords(generateSeedDailyRecords());
    setApps(INITIAL_APPS);
    setAlerts(INITIAL_ALERTS);
    setIsAudioMuted(false);
    setDailyWarningMB(3000);
    alertedCapsRef.current = {};
  }, []);

  // Toggle power efficiency mode
  const setPowerEfficiencyMode = useCallback((mode: 'performance' | 'balanced' | 'eco') => {
    setBatteryTelemetry((prev) => ({ ...prev, powerEfficiencyMode: mode }));
  }, []);

  return {
    interfaces,
    activeInterface,
    setActiveInterface,
    updateInterface,
    dailyRecords,
    apps,
    alerts,
    speedSamples,
    trafficPreset,
    setTrafficPreset,
    isDataSaverActive,
    setIsDataSaverActive,
    isAudioMuted,
    setIsAudioMuted,
    dailyWarningMB,
    setDailyWarningMB,
    browserNetwork,
    batteryTelemetry,
    setPowerEfficiencyMode,
    getCycleUsage,
    addAlert,
    dismissAlert,
    markAllAlertsRead,
    clearAllAlerts,
    simulateDataSurge,
    toggleAppRestriction,
    updateSignalDbm,
    resetToDefaults,
  };
}
