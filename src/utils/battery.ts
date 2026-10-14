/**
 * Battery & Daemon Power Consumption Telemetry Model
 */

export interface BatteryTelemetry {
  level: number; // 0 to 100%
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  currentDrawMa: number; // instantaneous current draw attributed to daemon + radio, in mA
  accumulatedDaemonMah: number; // total cumulative mAh consumed by the monitor daemon
  batteryCapacityMah: number; // baseline battery capacity (e.g. 4,500 mAh)
  temperatureC: number; // device thermal state in Celsius
  powerEfficiencyMode: 'performance' | 'balanced' | 'eco';
}

/**
 * Calculates instantaneous daemon current draw in mA based on interface, signal, and throughput
 */
export function calculateInstantaneousDrawMa(
  interfaceId: 'wifi' | 'sim1' | 'sim2',
  throughputBytesPerSec: number,
  signalDbm: number,
  efficiencyMode: 'performance' | 'balanced' | 'eco' = 'balanced'
): number {
  // Baseline daemon wake-lock & JS execution loop (1.5 - 3 mA)
  let baseMa = efficiencyMode === 'eco' ? 1.2 : efficiencyMode === 'performance' ? 3.5 : 2.2;

  // Radio state contribution:
  // Wi-Fi low-power DTIM/beacon listening vs Cellular 5G/LTE RRC Connected state
  if (interfaceId === 'wifi') {
    baseMa += 1.8;
  } else if (interfaceId === 'sim1') {
    baseMa += 4.5; // 5G NR modem wake state
  } else {
    baseMa += 3.8; // LTE modem wake state
  }

  // RF Transmitter Power Backoff:
  // When signal is weak (< -90 dBm), modem ramps up Tx power, drawing more mA
  if (signalDbm < -95) {
    baseMa += 2.8;
  } else if (signalDbm < -80) {
    baseMa += 1.2;
  }

  // Active Throughput packet parsing overhead
  const throughputMB = throughputBytesPerSec / (1024 * 1024);
  if (throughputMB > 20) {
    baseMa += 8.5; // heavy streaming / packet surge
  } else if (throughputMB > 5) {
    baseMa += 4.0;
  } else if (throughputMB > 0.5) {
    baseMa += 1.5;
  }

  return parseFloat(baseMa.toFixed(2));
}

/**
 * Calculates battery percentage impact: (daemonMah / totalCapacity) * 100
 */
export function calculateBatteryImpactPercent(
  daemonMah: number,
  totalCapacityMah: number = 4500
): string {
  const pct = (daemonMah / totalCapacityMah) * 100;
  return pct < 0.01 ? '<0.01%' : `${pct.toFixed(2)}%`;
}
