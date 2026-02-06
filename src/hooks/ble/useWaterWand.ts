/**
 * useWaterWand - BLE Water Testing Wand Hook
 *
 * Connects to YINMIK BLE water testing devices and reads water parameters.
 * Designed for foreground use (user initiates test while app is open).
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   device,
 *   lastReading,
 *   scan,
 *   connect,
 *   disconnect,
 *   readWater,
 * } = useWaterWand();
 *
 * // Scan for devices
 * await scan();
 *
 * // Connect to found device
 * await connect(device.deviceId);
 *
 * // Read water parameters
 * const reading = await readWater();
 * console.log(`pH: ${reading.ph}`);
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { BleClient, BleDevice, numbersToDataView } from '@capacitor-community/bluetooth-le';
import { toast } from 'sonner';
import {
  YINMIK_SERVICE_UUID,
  YINMIK_CHARACTERISTICS,
  YINMIK_DEVICE_PREFIXES,
  parseWaterReading,
  createCommand,
  validateReading,
  type WaterReading,
  type YinmikDevice,
  type ConnectionStatus,
} from '@/lib/ble/yinmikProtocol';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

interface UseWaterWandOptions {
  /** Auto-disconnect after reading (default: false) */
  autoDisconnect?: boolean;
  /** Timeout for operations in ms (default: 10000) */
  timeout?: number;
  /** Callback when reading is received */
  onReading?: (reading: WaterReading) => void;
  /** Callback on connection status change */
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface UseWaterWandReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Connected device info */
  device: YinmikDevice | null;
  /** List of discovered devices during scan */
  discoveredDevices: YinmikDevice[];
  /** Last water reading */
  lastReading: WaterReading | null;
  /** Whether BLE is supported and enabled */
  isSupported: boolean;
  /** Error message if any */
  error: string | null;

  // Actions
  /** Initialize BLE (call once on mount) */
  initialize: () => Promise<boolean>;
  /** Scan for water wand devices */
  scan: (duration?: number) => Promise<YinmikDevice[]>;
  /** Stop scanning */
  stopScan: () => Promise<void>;
  /** Connect to a device */
  connect: (deviceId: string) => Promise<boolean>;
  /** Disconnect from device */
  disconnect: () => Promise<void>;
  /** Read water parameters from connected device */
  readWater: () => Promise<WaterReading | null>;
  /** Read battery level */
  readBattery: () => Promise<number | null>;
  /** Clear error state */
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWaterWand(options: UseWaterWandOptions = {}): UseWaterWandReturn {
  const {
    autoDisconnect = false,
    timeout = 10000,
    onReading,
    onStatusChange,
    onError,
  } = options;

  // State
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [device, setDevice] = useState<YinmikDevice | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<YinmikDevice[]>([]);
  const [lastReading, setLastReading] = useState<WaterReading | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const isInitializedRef = useRef(false);
  const connectedDeviceIdRef = useRef<string | null>(null);
  const notificationBufferRef = useRef<Uint8Array>(new Uint8Array(0));
  const readingResolverRef = useRef<((reading: WaterReading | null) => void) | null>(null);

  // Update status with callback
  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // Handle errors
  const handleError = useCallback((err: unknown, context: string) => {
    const message = err instanceof Error ? err.message : String(err);
    const fullMessage = `${context}: ${message}`;

    logger.error(`[WaterWand] ${fullMessage}`);
    setError(fullMessage);
    updateStatus('error');
    onError?.(new Error(fullMessage));

    toast.error('Water Wand Error', { description: fullMessage });
  }, [updateStatus, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      updateStatus(connectedDeviceIdRef.current ? 'connected' : 'disconnected');
    }
  }, [status, updateStatus]);

  // ============================================================================
  // Initialize BLE
  // ============================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitializedRef.current) return true;

    try {
      await BleClient.initialize();
      isInitializedRef.current = true;

      // Check if BLE is enabled
      const enabled = await BleClient.isEnabled();
      setIsSupported(enabled);

      if (!enabled) {
        toast.warning('Bluetooth Disabled', {
          description: 'Please enable Bluetooth to use the water wand.',
        });
        return false;
      }

      return true;
    } catch (err) {
      handleError(err, 'Failed to initialize Bluetooth');
      setIsSupported(false);
      return false;
    }
  }, [handleError]);

  // ============================================================================
  // Scan for Devices
  // ============================================================================

  const scan = useCallback(async (duration = 5000): Promise<YinmikDevice[]> => {
    const initialized = await initialize();
    if (!initialized) return [];

    updateStatus('scanning');
    setDiscoveredDevices([]);
    const devices: YinmikDevice[] = [];

    try {
      // Request device with service filter
      // This triggers the native device picker on iOS
      await BleClient.requestLEScan(
        {
          services: [YINMIK_SERVICE_UUID],
          // Alternatively, scan by name prefix:
          // namePrefix: 'BLE-',
        },
        (result) => {
          const deviceName = result.device.name || 'Unknown Device';

          // Check if it's a YINMIK device
          const isYinmik = YINMIK_DEVICE_PREFIXES.some(
            prefix => deviceName.toUpperCase().startsWith(prefix.toUpperCase())
          );

          if (isYinmik || result.device.name?.includes('BLE-')) {
            const existingIndex = devices.findIndex(d => d.deviceId === result.device.deviceId);

            const yinmikDevice: YinmikDevice = {
              deviceId: result.device.deviceId,
              name: deviceName,
              rssi: result.rssi || -100,
              model: extractModel(deviceName),
            };

            if (existingIndex >= 0) {
              devices[existingIndex] = yinmikDevice;
            } else {
              devices.push(yinmikDevice);
              logger.log('[WaterWand] Found device:', yinmikDevice);
            }

            setDiscoveredDevices([...devices]);
          }
        }
      );

      // Stop scanning after duration
      await new Promise(resolve => setTimeout(resolve, duration));
      await BleClient.stopLEScan();

      updateStatus('disconnected');
      return devices;
    } catch (err) {
      handleError(err, 'Scan failed');
      return devices;
    }
  }, [initialize, updateStatus, handleError]);

  const stopScan = useCallback(async (): Promise<void> => {
    try {
      await BleClient.stopLEScan();
      updateStatus('disconnected');
    } catch (err) {
      logger.warn('[WaterWand] Stop scan error:', err);
    }
  }, [updateStatus]);

  // ============================================================================
  // Connect to Device
  // ============================================================================

  const connect = useCallback(async (deviceId: string): Promise<boolean> => {
    const initialized = await initialize();
    if (!initialized) return false;

    updateStatus('connecting');

    try {
      // Set up disconnect handler
      await BleClient.connect(deviceId, (disconnectedDeviceId) => {
        logger.log('[WaterWand] Device disconnected:', disconnectedDeviceId);
        if (connectedDeviceIdRef.current === disconnectedDeviceId) {
          connectedDeviceIdRef.current = null;
          setDevice(null);
          updateStatus('disconnected');
          toast.info('Water wand disconnected');
        }
      });

      connectedDeviceIdRef.current = deviceId;

      // Get device info
      const deviceName = discoveredDevices.find(d => d.deviceId === deviceId)?.name || 'Water Wand';

      setDevice({
        deviceId,
        name: deviceName,
        rssi: -50,
        model: extractModel(deviceName),
      });

      // Set up notifications for receiving data
      await setupNotifications(deviceId);

      updateStatus('connected');
      toast.success('Connected', { description: `Connected to ${deviceName}` });

      return true;
    } catch (err) {
      connectedDeviceIdRef.current = null;
      handleError(err, 'Connection failed');
      return false;
    }
  }, [initialize, discoveredDevices, updateStatus, handleError]);

  // ============================================================================
  // Disconnect
  // ============================================================================

  const disconnect = useCallback(async (): Promise<void> => {
    const deviceId = connectedDeviceIdRef.current;
    if (!deviceId) return;

    try {
      // Stop notifications first
      try {
        await BleClient.stopNotifications(
          deviceId,
          YINMIK_SERVICE_UUID,
          YINMIK_CHARACTERISTICS.DATA
        );
      } catch {
        // Ignore notification stop errors
      }

      await BleClient.disconnect(deviceId);
      connectedDeviceIdRef.current = null;
      setDevice(null);
      updateStatus('disconnected');
    } catch (err) {
      logger.warn('[WaterWand] Disconnect error:', err);
      // Force cleanup
      connectedDeviceIdRef.current = null;
      setDevice(null);
      updateStatus('disconnected');
    }
  }, [updateStatus]);

  // ============================================================================
  // Setup Notifications
  // ============================================================================

  const setupNotifications = useCallback(async (deviceId: string): Promise<void> => {
    try {
      await BleClient.startNotifications(
        deviceId,
        YINMIK_SERVICE_UUID,
        YINMIK_CHARACTERISTICS.DATA,
        (value) => {
          logger.log('[WaterWand] Notification received');

          // Parse the reading
          const reading = parseWaterReading(value);

          if (reading && validateReading(reading)) {
            const fullReading: WaterReading = {
              ph: reading.ph ?? null,
              temperature: reading.temperature ?? null,
              ec: reading.ec ?? null,
              tds: reading.tds ?? null,
              salinity: reading.salinity ?? null,
              orp: reading.orp ?? null,
              sg: reading.sg ?? null,
              battery: reading.battery ?? null,
              rawData: reading.rawData || new Uint8Array(0),
              timestamp: reading.timestamp || new Date(),
            };

            setLastReading(fullReading);
            onReading?.(fullReading);

            // Resolve any pending read promise
            if (readingResolverRef.current) {
              readingResolverRef.current(fullReading);
              readingResolverRef.current = null;
            }
          }
        }
      );
    } catch (err) {
      logger.warn('[WaterWand] Failed to setup notifications:', err);
      // Non-fatal - we can still try to read directly
    }
  }, [onReading]);

  // ============================================================================
  // Read Water Parameters
  // ============================================================================

  const readWater = useCallback(async (): Promise<WaterReading | null> => {
    const deviceId = connectedDeviceIdRef.current;
    if (!deviceId) {
      toast.error('Not connected', { description: 'Please connect to water wand first' });
      return null;
    }

    updateStatus('reading');

    try {
      // Method 1: Try sending a read command and wait for notification
      const readCommand = createCommand('read');

      await BleClient.write(
        deviceId,
        YINMIK_SERVICE_UUID,
        YINMIK_CHARACTERISTICS.DATA,
        numbersToDataView(Array.from(readCommand))
      );

      // Wait for notification response
      const reading = await Promise.race([
        new Promise<WaterReading | null>((resolve) => {
          readingResolverRef.current = resolve;
        }),
        new Promise<WaterReading | null>((resolve) => {
          setTimeout(() => resolve(null), timeout);
        }),
      ]);

      if (reading) {
        updateStatus('connected');

        if (autoDisconnect) {
          await disconnect();
        }

        return reading;
      }

      // Method 2: Try direct read if notification didn't work
      logger.log('[WaterWand] Trying direct read...');

      const directResult = await BleClient.read(
        deviceId,
        YINMIK_SERVICE_UUID,
        YINMIK_CHARACTERISTICS.DATA
      );

      const directReading = parseWaterReading(directResult);

      if (directReading && validateReading(directReading)) {
        const fullReading: WaterReading = {
          ph: directReading.ph ?? null,
          temperature: directReading.temperature ?? null,
          ec: directReading.ec ?? null,
          tds: directReading.tds ?? null,
          salinity: directReading.salinity ?? null,
          orp: directReading.orp ?? null,
          sg: directReading.sg ?? null,
          battery: directReading.battery ?? null,
          rawData: directReading.rawData || new Uint8Array(0),
          timestamp: directReading.timestamp || new Date(),
        };

        setLastReading(fullReading);
        onReading?.(fullReading);
        updateStatus('connected');

        if (autoDisconnect) {
          await disconnect();
        }

        return fullReading;
      }

      throw new Error('No valid reading received');
    } catch (err) {
      handleError(err, 'Failed to read water parameters');
      updateStatus('connected');
      return null;
    }
  }, [timeout, autoDisconnect, disconnect, updateStatus, handleError, onReading]);

  // ============================================================================
  // Read Battery Level
  // ============================================================================

  const readBattery = useCallback(async (): Promise<number | null> => {
    const deviceId = connectedDeviceIdRef.current;
    if (!deviceId) return null;

    try {
      const result = await BleClient.read(
        deviceId,
        YINMIK_CHARACTERISTICS.BATTERY_SERVICE,
        YINMIK_CHARACTERISTICS.BATTERY_LEVEL
      );

      const bytes = new Uint8Array(result.buffer);
      if (bytes.length > 0) {
        const battery = bytes[0];
        logger.log('[WaterWand] Battery level:', battery);
        return battery;
      }

      return null;
    } catch (err) {
      logger.warn('[WaterWand] Failed to read battery:', err);
      return null;
    }
  }, []);

  // ============================================================================
  // Cleanup on Unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      // Disconnect on unmount
      const deviceId = connectedDeviceIdRef.current;
      if (deviceId) {
        BleClient.disconnect(deviceId).catch(() => {});
      }
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    status,
    device,
    discoveredDevices,
    lastReading,
    isSupported,
    error,

    initialize,
    scan,
    stopScan,
    connect,
    disconnect,
    readWater,
    readBattery,
    clearError,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function extractModel(deviceName: string): string | null {
  // Extract model from device name like "BLE-9909" -> "9909"
  const match = deviceName.match(/BLE-(\w+)/i);
  return match ? match[1] : null;
}

// ============================================================================
// Convenience hook for quick read
// ============================================================================

/**
 * Simplified hook for one-shot water testing
 *
 * @example
 * ```tsx
 * const { testWater, reading, isLoading } = useQuickWaterTest({
 *   aquariumId: 'abc-123',
 *   onSuccess: (reading) => console.log('Got reading:', reading),
 * });
 *
 * <Button onClick={testWater}>Test Water</Button>
 * ```
 */
export function useQuickWaterTest(options: {
  aquariumId?: string;
  onSuccess?: (reading: WaterReading) => void;
  onError?: (error: Error) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [reading, setReading] = useState<WaterReading | null>(null);

  const wand = useWaterWand({
    autoDisconnect: true,
    onReading: (r) => {
      setReading(r);
      options.onSuccess?.(r);
    },
    onError: options.onError,
  });

  const testWater = useCallback(async () => {
    setIsLoading(true);
    setReading(null);

    try {
      // Scan for device
      const devices = await wand.scan(5000);

      if (devices.length === 0) {
        throw new Error('No water wand found. Make sure it is powered on.');
      }

      // Connect to first found device
      const connected = await wand.connect(devices[0].deviceId);
      if (!connected) {
        throw new Error('Failed to connect to water wand');
      }

      // Read water
      const result = await wand.readWater();
      if (!result) {
        throw new Error('Failed to read water parameters');
      }

      return result;
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wand, options]);

  return {
    testWater,
    reading,
    isLoading,
    status: wand.status,
    error: wand.error,
  };
}
