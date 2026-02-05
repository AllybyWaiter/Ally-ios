# YINMIK BLE Water Tester Integration Guide

## Overview

This document covers the integration of YINMIK BLE water testing wands with the Ally app using Capacitor's BLE plugin.

**Supported Devices:**
- BLE-9909 (5-in-1: pH, EC, TDS, Temp, Salinity)
- BLE-9908 (pH, EC, TDS, Temp)
- BLE-C600 (7-in-1: pH, EC, TDS, Salinity, S.G., ORP, Temp)
- BLE-9901 (3-in-1: pH, EC, TDS)
- BLE-9902 (3-in-1: pH, EC, Temp)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [API Reference](#api-reference)
5. [BLE Protocol Details](#ble-protocol-details)
6. [Troubleshooting](#troubleshooting)
7. [Testing & Debugging](#testing--debugging)
8. [Questions for YINMIK](#questions-for-yinmik)

---

## Prerequisites

### iOS Configuration

Add to `ios/App/App/Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Ally uses Bluetooth to connect to your water testing wand and read water parameters.</string>

<key>NSBluetoothPeripheralUsageDescription</key>
<string>Ally uses Bluetooth to connect to your water testing wand and read water parameters.</string>

<key>UIBackgroundModes</key>
<array>
  <string>bluetooth-central</string>
</array>
```

### Capacitor Plugin

```bash
npm install @capacitor-community/bluetooth-le
npx cap sync ios
```

---

## Installation

The BLE integration files are located at:

```
src/
├── hooks/
│   └── ble/
│       ├── index.ts
│       └── useWaterWand.ts      # Main hook
└── lib/
    └── ble/
        ├── index.ts
        └── yinmikProtocol.ts    # Protocol & parsing
```

---

## Quick Start

### Basic Usage

```tsx
import { useWaterWand } from '@/hooks/ble';

function WaterTestScreen() {
  const {
    status,
    device,
    lastReading,
    scan,
    connect,
    readWater,
    disconnect,
  } = useWaterWand();

  const handleTest = async () => {
    // 1. Scan for devices
    const devices = await scan();

    if (devices.length === 0) {
      alert('No water wand found');
      return;
    }

    // 2. Connect to first device
    await connect(devices[0].deviceId);

    // 3. Read water parameters
    const reading = await readWater();

    if (reading) {
      console.log(`pH: ${reading.ph}`);
      console.log(`Temp: ${reading.temperature}°C`);
      console.log(`EC: ${reading.ec} μS/cm`);
    }

    // 4. Disconnect
    await disconnect();
  };

  return (
    <div>
      <p>Status: {status}</p>
      {device && <p>Connected to: {device.name}</p>}
      {lastReading && (
        <div>
          <p>pH: {lastReading.ph}</p>
          <p>Temperature: {lastReading.temperature}°C</p>
        </div>
      )}
      <button onClick={handleTest}>Test Water</button>
    </div>
  );
}
```

### One-Shot Testing (Simplified)

```tsx
import { useQuickWaterTest } from '@/hooks/ble';

function QuickTestButton({ aquariumId }: { aquariumId: string }) {
  const { testWater, reading, isLoading, error } = useQuickWaterTest({
    aquariumId,
    onSuccess: (reading) => {
      // Save to database
      saveWaterReading(aquariumId, reading);
    },
  });

  return (
    <button onClick={testWater} disabled={isLoading}>
      {isLoading ? 'Testing...' : 'Quick Test'}
    </button>
  );
}
```

---

## API Reference

### useWaterWand

```typescript
function useWaterWand(options?: UseWaterWandOptions): UseWaterWandReturn;
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoDisconnect` | `boolean` | `false` | Disconnect after reading |
| `timeout` | `number` | `10000` | Operation timeout (ms) |
| `onReading` | `(reading) => void` | - | Called when reading received |
| `onStatusChange` | `(status) => void` | - | Called on status change |
| `onError` | `(error) => void` | - | Called on error |

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | Current status |
| `device` | `YinmikDevice \| null` | Connected device |
| `discoveredDevices` | `YinmikDevice[]` | Found devices |
| `lastReading` | `WaterReading \| null` | Last reading |
| `isSupported` | `boolean` | BLE supported |
| `error` | `string \| null` | Error message |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `initialize()` | `Promise<boolean>` | Initialize BLE |
| `scan(duration?)` | `Promise<YinmikDevice[]>` | Scan for devices |
| `stopScan()` | `Promise<void>` | Stop scanning |
| `connect(deviceId)` | `Promise<boolean>` | Connect to device |
| `disconnect()` | `Promise<void>` | Disconnect |
| `readWater()` | `Promise<WaterReading \| null>` | Read parameters |
| `readBattery()` | `Promise<number \| null>` | Read battery % |
| `clearError()` | `void` | Clear error state |

### WaterReading

```typescript
interface WaterReading {
  ph: number | null;           // 0-14
  temperature: number | null;  // Celsius
  ec: number | null;           // μS/cm
  tds: number | null;          // ppm
  salinity: number | null;     // ppt
  orp: number | null;          // mV
  sg: number | null;           // Specific gravity
  battery: number | null;      // 0-100%
  rawData: Uint8Array;         // For debugging
  timestamp: Date;
}
```

---

## BLE Protocol Details

### Service & Characteristic UUIDs

| Name | UUID |
|------|------|
| **Service** | `0000ff01-0000-1000-8000-00805f9b34fb` |
| **Data Characteristic** | `0000ff02-0000-1000-8000-00805f9b34fb` |
| **Config Characteristic** | `0000ff10-0000-1000-8000-00805f9b34fb` |
| **Battery Service** | `0000180f-0000-1000-8000-00805f9b34fb` |
| **Battery Level** | `00002a19-0000-1000-8000-00805f9b34fb` |

### Data Format

The exact data format varies by model. The protocol handler attempts multiple parsing strategies:

**1. ASCII Text Format**
```
"PH:7.20,TEMP:25.5,EC:450,TDS:225"
```

**2. Binary Format (Common Pattern)**
```
[Header][pH_H][pH_L][Temp_H][Temp_L][EC_H][EC_L][TDS_H][TDS_L][Checksum]

Example: 0x01 0x02 0xD0 0x00 0xFF 0x01 0xC2 0x00 0xE1 0xXX
         Header pH=7.20 Temp=25.5 EC=450    TDS=225   Checksum
```

### Determining Your Device's Format

When you receive your device, run this code to capture raw data:

```typescript
const { readWater, lastReading } = useWaterWand();

const reading = await readWater();
if (reading?.rawData) {
  console.log('Raw bytes:',
    Array.from(reading.rawData)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
  );
}
```

Then update `yinmikProtocol.ts` with the correct parsing logic.

---

## Troubleshooting

### "No devices found"

1. **Check device power:** LED should be on
2. **Check Bluetooth:** Ensure iOS Bluetooth is enabled
3. **Check proximity:** Device should be within 1-2 meters
4. **Check pairing:** Device shouldn't be paired to another phone
5. **Restart device:** Power cycle the water wand

### "Connection failed"

1. **iOS permission:** Check Settings > Privacy > Bluetooth
2. **Too far away:** Move closer to device
3. **Try again:** BLE connections can be flaky, retry 2-3 times

### "Failed to read" / Status 133 error (Android)

This is a known Android BLE stack issue. Workarounds:
1. Disconnect and reconnect
2. Toggle Bluetooth off/on
3. Restart app
4. Use iOS if available (more reliable)

### "No valid reading received"

1. **Check probe:** Ensure probe is in water
2. **Wait for stabilization:** Some meters need 10-30 seconds
3. **Check calibration:** Device may need calibration
4. **Raw data:** Check console for raw bytes to debug parsing

---

## Testing & Debugging

### Debug Mode

Enable verbose logging:

```typescript
const wand = useWaterWand({
  onReading: (reading) => {
    console.log('[DEBUG] Reading:', reading);
    console.log('[DEBUG] Raw:',
      Array.from(reading.rawData).map(b => '0x' + b.toString(16)).join(', ')
    );
  },
});
```

### Mock Device (Development)

For testing without hardware:

```typescript
// src/lib/ble/__mocks__/useWaterWand.ts
export function useWaterWand() {
  return {
    status: 'connected',
    device: { deviceId: 'mock', name: 'Mock Wand', rssi: -50, model: '9909' },
    lastReading: {
      ph: 7.2,
      temperature: 25.5,
      ec: 450,
      tds: 225,
      salinity: null,
      orp: null,
      sg: null,
      battery: 85,
      rawData: new Uint8Array([0x01, 0x02, 0xD0]),
      timestamp: new Date(),
    },
    isSupported: true,
    error: null,
    initialize: async () => true,
    scan: async () => [{ deviceId: 'mock', name: 'Mock Wand', rssi: -50, model: '9909' }],
    connect: async () => true,
    disconnect: async () => {},
    readWater: async () => ({ ph: 7.2, temperature: 25.5, /* ... */ }),
    readBattery: async () => 85,
    clearError: () => {},
  };
}
```

### BLE Scanner Apps

Test your device with these apps first:
- **iOS:** LightBlue, nRF Connect
- **Android:** nRF Connect, BLE Scanner

---

## Questions for YINMIK

When ordering from YINMIK, ask for:

### 1. BLE Protocol Documentation

```
"Please provide the BLE GATT service and characteristic UUIDs,
and the data format specification for reading water parameters."
```

### 2. Data Format Specification

```
"What is the byte format for water readings?
- Which bytes represent pH?
- What scaling factor is used? (e.g., 720 = 7.20)
- Is it big-endian or little-endian?"
```

### 3. Commands

```
"What commands can be sent to the device?
- Command to request a reading
- Command to enter calibration mode
- Command to get device info/firmware version"
```

### 4. Sample Code

```
"Do you have sample iOS/Android code or an SDK for integration?"
```

### 5. White-Label Customization

```
"For white-label orders:
- Can the BLE device name be customized? (e.g., 'Ally-Wand')
- Can the app name in pairing be customized?
- What are the MOQ and lead times?"
```

---

## Integration with Ally App

### Saving Readings to Database

```typescript
import { useWaterWand } from '@/hooks/ble';
import { supabase } from '@/integrations/supabase/client';

function WaterTestWithSave({ aquariumId }: { aquariumId: string }) {
  const wand = useWaterWand({
    onReading: async (reading) => {
      // Save to Supabase
      const { error } = await supabase.from('water_tests').insert({
        aquarium_id: aquariumId,
        test_date: reading.timestamp.toISOString(),
        entry_method: 'ble_wand',
        confidence: 'device',
      });

      if (!error && reading.ph !== null) {
        await supabase.from('test_parameters').insert({
          test_id: /* test id */,
          parameter_name: 'pH',
          value: reading.ph,
          unit: '',
        });
      }
      // ... save other parameters
    },
  });

  // ...
}
```

### UI Component Example

See `src/components/water-tests/WaterWandTest.tsx` (to be created) for a full UI implementation.

---

## References

- [capacitor-community/bluetooth-le](https://github.com/capacitor-community/bluetooth-le)
- [YINMIK Official Site](https://www.yinmik.com/)
- [BLE Monitor Issue #838](https://github.com/custom-components/ble_monitor/issues/838) - Protocol reverse engineering
- [Cordova BLE Issue #971](https://github.com/don/cordova-plugin-ble-central/issues/971) - Android compatibility notes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-02-04 | Initial implementation |
