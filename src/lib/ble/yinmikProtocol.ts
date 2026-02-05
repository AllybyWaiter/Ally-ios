/**
 * YINMIK BLE Water Tester Protocol
 *
 * Reverse-engineered protocol for YINMIK BLE water testing devices.
 * Models supported: BLE-9909, BLE-9908, BLE-C600, BLE-9901, BLE-9902
 *
 * @see https://github.com/custom-components/ble_monitor/issues/838
 * @see https://github.com/don/cordova-plugin-ble-central/issues/971
 */

// ============================================================================
// BLE Service & Characteristic UUIDs
// ============================================================================

export const YINMIK_SERVICE_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
export const YINMIK_SERVICE_UUID_SHORT = 'FF01';

export const YINMIK_CHARACTERISTICS = {
  /** Primary data characteristic - Read/Write/Notify */
  DATA: '0000ff02-0000-1000-8000-00805f9b34fb',
  DATA_SHORT: 'FF02',

  /** Secondary read-only characteristic */
  CONFIG: '0000ff10-0000-1000-8000-00805f9b34fb',
  CONFIG_SHORT: 'FF10',

  /** Battery level (standard BLE service) */
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
} as const;

// Device name prefixes for scanning
export const YINMIK_DEVICE_PREFIXES = [
  'BLE-9909',
  'BLE-9908',
  'BLE-C600',
  'BLE-9901',
  'BLE-9902',
  'BLE-Ph01',
  'BLE-9100',
  'YINMIK',
] as const;

// ============================================================================
// Data Types
// ============================================================================

export interface WaterReading {
  /** pH value (0-14 scale) */
  ph: number | null;
  /** Temperature in Celsius */
  temperature: number | null;
  /** Electrical Conductivity in μS/cm */
  ec: number | null;
  /** Total Dissolved Solids in ppm */
  tds: number | null;
  /** Salinity in ppt (parts per thousand) */
  salinity: number | null;
  /** Oxidation-Reduction Potential in mV */
  orp: number | null;
  /** Specific Gravity */
  sg: number | null;
  /** Battery level percentage (0-100) */
  battery: number | null;
  /** Raw bytes for debugging */
  rawData: Uint8Array;
  /** Timestamp of reading */
  timestamp: Date;
}

export interface YinmikDevice {
  deviceId: string;
  name: string;
  rssi: number;
  model: string | null;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'reading'
  | 'error';

// ============================================================================
// Data Parsing
// ============================================================================

/**
 * Parse raw BLE data from YINMIK device into water reading.
 *
 * NOTE: This parsing logic is based on common BLE water tester protocols.
 * You may need to adjust based on actual device output once you receive
 * your specific model. Run `logRawData()` to capture actual bytes.
 *
 * Common data formats observed in similar Chinese BLE water testers:
 * - Format A: [Header][pH_H][pH_L][Temp_H][Temp_L][EC_H][EC_L][TDS_H][TDS_L][Checksum]
 * - Format B: ASCII string like "PH:7.20,TEMP:25.5,EC:450,TDS:225\n"
 */
export function parseWaterReading(data: DataView | ArrayBuffer): Partial<WaterReading> {
  const buffer = data instanceof DataView ? data.buffer : data;
  const bytes = new Uint8Array(buffer);

  // Log raw data for debugging during development
  console.log('[YINMIK] Raw bytes:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));

  // Try ASCII parsing first (some devices send text)
  const asciiResult = tryParseAscii(bytes);
  if (asciiResult) {
    return { ...asciiResult, rawData: bytes, timestamp: new Date() };
  }

  // Try binary parsing
  const binaryResult = tryParseBinary(bytes);
  if (binaryResult) {
    return { ...binaryResult, rawData: bytes, timestamp: new Date() };
  }

  // Return raw data for manual inspection
  return {
    rawData: bytes,
    timestamp: new Date(),
  };
}

/**
 * Try parsing as ASCII text response
 * Example: "PH:7.20,TEMP:25.5,EC:450"
 */
function tryParseAscii(bytes: Uint8Array): Partial<WaterReading> | null {
  try {
    const text = new TextDecoder().decode(bytes);

    // Check if it looks like text data
    if (!/[A-Za-z]/.test(text)) return null;

    const result: Partial<WaterReading> = {};

    // Common patterns in water tester ASCII output
    const patterns = {
      ph: /PH[:\s]*(\d+\.?\d*)/i,
      temperature: /TEMP[:\s]*(\d+\.?\d*)/i,
      ec: /EC[:\s]*(\d+\.?\d*)/i,
      tds: /TDS[:\s]*(\d+\.?\d*)/i,
      salinity: /SAL(?:T|INITY)?[:\s]*(\d+\.?\d*)/i,
      orp: /ORP[:\s]*(-?\d+\.?\d*)/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        result[key as keyof WaterReading] = parseFloat(match[1]);
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Try parsing as binary protocol
 * Adjust byte positions based on actual device output
 */
function tryParseBinary(bytes: Uint8Array): Partial<WaterReading> | null {
  // Need at least 4 bytes for minimal reading
  if (bytes.length < 4) return null;

  const result: Partial<WaterReading> = {};

  // Common binary format: each value is 2 bytes (big-endian), scaled by 100
  // This is a starting point - adjust based on actual device output

  try {
    // Check for common header patterns
    const header = bytes[0];

    // Pattern 1: Header byte indicates data type
    if (header === 0x01 || header === 0xAA || header === 0x55) {
      // Skip header, parse subsequent values
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      if (bytes.length >= 3) {
        // pH is often first value, scaled by 100 (e.g., 720 = 7.20)
        const phRaw = dataView.getUint16(1, false); // big-endian
        if (phRaw > 0 && phRaw < 1400) {
          result.ph = phRaw / 100;
        }
      }

      if (bytes.length >= 5) {
        // Temperature often second, scaled by 10 (e.g., 255 = 25.5°C)
        const tempRaw = dataView.getUint16(3, false);
        if (tempRaw > 0 && tempRaw < 1000) {
          result.temperature = tempRaw / 10;
        }
      }

      if (bytes.length >= 7) {
        // EC in μS/cm (no scaling or /10)
        const ecRaw = dataView.getUint16(5, false);
        if (ecRaw < 50000) {
          result.ec = ecRaw;
        }
      }

      if (bytes.length >= 9) {
        // TDS in ppm
        const tdsRaw = dataView.getUint16(7, false);
        if (tdsRaw < 50000) {
          result.tds = tdsRaw;
        }
      }
    }

    // Pattern 2: No header, direct values
    if (Object.keys(result).length === 0 && bytes.length >= 8) {
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      const val1 = dataView.getUint16(0, false);
      const val2 = dataView.getUint16(2, false);

      // Heuristic: pH values are typically 0-14, so raw 0-1400
      if (val1 > 0 && val1 < 1400) {
        result.ph = val1 / 100;
      }
      if (val2 > 0 && val2 < 1000) {
        result.temperature = val2 / 10;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (e) {
    console.warn('[YINMIK] Binary parse error:', e);
    return null;
  }
}

/**
 * Create a command to send to the device
 * Common commands for water testers
 */
export function createCommand(type: 'read' | 'calibrate' | 'info'): Uint8Array {
  switch (type) {
    case 'read':
      // Request current reading - common patterns
      return new Uint8Array([0x01, 0x03, 0x00, 0x00, 0x00, 0x04]);
    case 'calibrate':
      // Enter calibration mode
      return new Uint8Array([0x02, 0x01]);
    case 'info':
      // Request device info
      return new Uint8Array([0x03, 0x00]);
    default:
      return new Uint8Array([0x01]);
  }
}

/**
 * Validate a water reading is within reasonable bounds
 */
export function validateReading(reading: Partial<WaterReading>): boolean {
  if (reading.ph !== null && reading.ph !== undefined) {
    if (reading.ph < 0 || reading.ph > 14) return false;
  }
  if (reading.temperature !== null && reading.temperature !== undefined) {
    if (reading.temperature < -10 || reading.temperature > 60) return false;
  }
  if (reading.ec !== null && reading.ec !== undefined) {
    if (reading.ec < 0 || reading.ec > 100000) return false;
  }
  if (reading.tds !== null && reading.tds !== undefined) {
    if (reading.tds < 0 || reading.tds > 100000) return false;
  }
  return true;
}

/**
 * Format reading for display
 */
export function formatReading(reading: Partial<WaterReading>): Record<string, string> {
  const formatted: Record<string, string> = {};

  if (reading.ph !== null && reading.ph !== undefined) {
    formatted.pH = reading.ph.toFixed(2);
  }
  if (reading.temperature !== null && reading.temperature !== undefined) {
    formatted.Temperature = `${reading.temperature.toFixed(1)}°C`;
  }
  if (reading.ec !== null && reading.ec !== undefined) {
    formatted.EC = `${reading.ec.toFixed(0)} μS/cm`;
  }
  if (reading.tds !== null && reading.tds !== undefined) {
    formatted.TDS = `${reading.tds.toFixed(0)} ppm`;
  }
  if (reading.salinity !== null && reading.salinity !== undefined) {
    formatted.Salinity = `${reading.salinity.toFixed(2)} ppt`;
  }
  if (reading.orp !== null && reading.orp !== undefined) {
    formatted.ORP = `${reading.orp.toFixed(0)} mV`;
  }
  if (reading.battery !== null && reading.battery !== undefined) {
    formatted.Battery = `${reading.battery}%`;
  }

  return formatted;
}
