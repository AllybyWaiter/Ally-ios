/**
 * BLE Hooks
 *
 * Bluetooth Low Energy functionality for water testing devices.
 */

export { useWaterWand, useQuickWaterTest } from './useWaterWand';
export type {
  WaterReading,
  YinmikDevice,
  ConnectionStatus,
} from '@/lib/ble/yinmikProtocol';
