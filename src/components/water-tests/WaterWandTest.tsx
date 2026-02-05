/**
 * WaterWandTest - UI Component for BLE Water Testing
 *
 * Provides a complete interface for connecting to a YINMIK BLE water wand
 * and recording water test results.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  Droplets,
  Thermometer,
  Zap,
  Battery,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWaterWand, type WaterReading, type YinmikDevice } from '@/hooks/ble';
import { formatReading } from '@/lib/ble/yinmikProtocol';

interface WaterWandTestProps {
  aquariumId: string;
  aquariumName: string;
  onReadingComplete?: (reading: WaterReading) => void;
}

export function WaterWandTest({
  aquariumId,
  aquariumName,
  onReadingComplete,
}: WaterWandTestProps) {
  const [showDeviceList, setShowDeviceList] = useState(false);

  const {
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
  } = useWaterWand({
    onReading: (reading) => {
      onReadingComplete?.(reading);
    },
  });

  // Status icon and color
  const getStatusDisplay = () => {
    switch (status) {
      case 'disconnected':
        return { icon: Bluetooth, color: 'text-muted-foreground', text: 'Ready to connect' };
      case 'scanning':
        return { icon: BluetoothSearching, color: 'text-blue-500', text: 'Scanning...' };
      case 'connecting':
        return { icon: BluetoothSearching, color: 'text-yellow-500', text: 'Connecting...' };
      case 'connected':
        return { icon: BluetoothConnected, color: 'text-green-500', text: 'Connected' };
      case 'reading':
        return { icon: Droplets, color: 'text-blue-500', text: 'Reading water...' };
      case 'error':
        return { icon: XCircle, color: 'text-destructive', text: 'Error' };
      default:
        return { icon: Bluetooth, color: 'text-muted-foreground', text: status };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Handle scan button
  const handleScan = async () => {
    clearError();
    setShowDeviceList(true);
    await scan(5000);
  };

  // Handle device selection
  const handleSelectDevice = async (selectedDevice: YinmikDevice) => {
    setShowDeviceList(false);
    await connect(selectedDevice.deviceId);
  };

  // Handle read button
  const handleRead = async () => {
    clearError();
    await readWater();
  };

  // Format reading value
  const formatValue = (value: number | null, unit: string, decimals = 1) => {
    if (value === null) return '—';
    return `${value.toFixed(decimals)}${unit}`;
  };

  // Check if we have any reading values
  const hasReading = lastReading && (
    lastReading.ph !== null ||
    lastReading.temperature !== null ||
    lastReading.ec !== null ||
    lastReading.tds !== null
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Water Wand Test
            </CardTitle>
            <CardDescription>
              Connect your BLE water tester to record parameters for {aquariumName}
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn('gap-1', statusDisplay.color)}>
            <StatusIcon className="h-3 w-3" />
            {statusDisplay.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Not Supported Alert */}
        {!isSupported && status !== 'disconnected' && (
          <Alert>
            <Bluetooth className="h-4 w-4" />
            <AlertDescription>
              Bluetooth is not available. Please enable Bluetooth in your device settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Device Info */}
        {device && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <BluetoothConnected className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{device.name}</p>
                <p className="text-xs text-muted-foreground">
                  Model: {device.model || 'Unknown'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        )}

        {/* Device List (during scan) */}
        {showDeviceList && status === 'scanning' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching for water wands...
            </div>
            <Progress value={undefined} className="animate-pulse" />
          </div>
        )}

        {showDeviceList && discoveredDevices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Found Devices:</p>
            {discoveredDevices.map((d) => (
              <button
                key={d.deviceId}
                onClick={() => handleSelectDevice(d)}
                className="w-full flex items-center justify-between p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bluetooth className="h-4 w-4" />
                  <div className="text-left">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Signal: {d.rssi} dBm
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Connect</Badge>
              </button>
            ))}
          </div>
        )}

        {showDeviceList && status !== 'scanning' && discoveredDevices.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Bluetooth className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No water wands found</p>
            <p className="text-xs mt-1">Make sure your device is powered on</p>
          </div>
        )}

        {/* Reading Results */}
        {hasReading && (
          <div className="grid grid-cols-2 gap-3">
            {lastReading.ph !== null && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <Droplets className="h-4 w-4" />
                  <span className="text-xs font-medium">pH</span>
                </div>
                <p className="text-2xl font-bold">{lastReading.ph.toFixed(2)}</p>
              </div>
            )}

            {lastReading.temperature !== null && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-xs font-medium">Temperature</span>
                </div>
                <p className="text-2xl font-bold">{lastReading.temperature.toFixed(1)}°C</p>
              </div>
            )}

            {lastReading.ec !== null && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">EC</span>
                </div>
                <p className="text-2xl font-bold">{lastReading.ec.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">μS/cm</p>
              </div>
            )}

            {lastReading.tds !== null && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                  <Droplets className="h-4 w-4" />
                  <span className="text-xs font-medium">TDS</span>
                </div>
                <p className="text-2xl font-bold">{lastReading.tds.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">ppm</p>
              </div>
            )}

            {lastReading.battery !== null && (
              <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Battery className="h-4 w-4" />
                <span>Battery: {lastReading.battery}%</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!device ? (
            <Button
              onClick={handleScan}
              disabled={status === 'scanning' || status === 'connecting'}
              className="flex-1"
            >
              {status === 'scanning' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <BluetoothSearching className="h-4 w-4 mr-2" />
                  Find Water Wand
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleRead}
              disabled={status === 'reading'}
              className="flex-1"
            >
              {status === 'reading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reading...
                </>
              ) : (
                <>
                  <Droplets className="h-4 w-4 mr-2" />
                  Test Water
                </>
              )}
            </Button>
          )}

          {hasReading && (
            <Button variant="outline" onClick={handleRead} disabled={!device}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Success indicator */}
        {hasReading && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Reading recorded at {lastReading.timestamp.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Instructions */}
        {!device && !showDeviceList && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">How to use:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Power on your water testing wand</li>
              <li>Tap "Find Water Wand" to scan</li>
              <li>Select your device from the list</li>
              <li>Dip the probe in your aquarium water</li>
              <li>Tap "Test Water" to record the reading</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WaterWandTest;
