/**
 * WaterWandSection - BLE Water Wand UI for Water Test Form
 *
 * A beautiful, animated interface for connecting to and reading from
 * a BLE water testing wand. Designed to match the PhotoUploadSection style.
 *
 * Currently uses mock data for demo purposes. Replace mock functions
 * with useWaterWand hook when BLE plugin is installed.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Waves,
  Signal,
  ChevronRight,
  Beaker,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for the wand (will be replaced with real hook later)
type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'ready_to_read' | 'reading' | 'error';

interface WaterReading {
  ph: number | null;
  temperature: number | null;
  ec: number | null;
  tds: number | null;
  salinity: number | null;
  battery: number | null;
  timestamp: Date;
}

interface WandDevice {
  deviceId: string;
  name: string;
  rssi: number;
  model: string | null;
}

interface WaterWandSectionProps {
  onReadingComplete?: (reading: WaterReading) => void;
  onParametersDetected?: (params: Record<string, string>) => void;
  units?: 'metric' | 'imperial';
}

// Temperature conversion helpers
const celsiusToFahrenheit = (celsius: number): number => (celsius * 9/5) + 32;
const formatTemperature = (celsius: number, units: 'metric' | 'imperial'): string => {
  if (units === 'imperial') {
    return `${celsiusToFahrenheit(celsius).toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
};

export function WaterWandSection({
  onReadingComplete,
  onParametersDetected,
  units = 'imperial',
}: WaterWandSectionProps) {
  // Mock state until BLE plugin is installed
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [device, setDevice] = useState<WandDevice | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<WandDevice[]>([]);
  const [lastReading, setLastReading] = useState<WaterReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [readingCountdown, setReadingCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate scanning animation
  useEffect(() => {
    if (status === 'scanning') {
      const interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 100);
      return () => clearInterval(interval);
    }
    setScanProgress(0);
  }, [status]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Mock scan - finds a fake device after 3 seconds
  const handleScan = async () => {
    setStatus('scanning');
    setError(null);
    setDiscoveredDevices([]);

    // Simulate finding a device after scanning
    setTimeout(() => {
      const mockDevices: WandDevice[] = [
        {
          deviceId: 'mock-ally-wand-001',
          name: 'Ally Wand 9909',
          rssi: -45,
          model: 'BLE-9909',
        },
      ];
      setDiscoveredDevices(mockDevices);
      setStatus('disconnected');
    }, 3000);
  };

  // Mock connect - pairs with device after 2 seconds
  const handleConnect = async (selectedDevice: WandDevice) => {
    setStatus('connecting');
    setDiscoveredDevices([]);

    // Simulate pairing
    setTimeout(() => {
      setDevice(selectedDevice);
      setStatus('connected');
    }, 2000);
  };

  const handleDisconnect = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setDevice(null);
    setStatus('disconnected');
    setLastReading(null);
    setReadingCountdown(0);
  };

  // User is ready - start 10 second countdown then show readings
  const handleReadyToRead = () => {
    setStatus('reading');
    setReadingCountdown(10);

    countdownRef.current = setInterval(() => {
      setReadingCountdown(prev => {
        if (prev <= 1) {
          // Countdown complete - show readings
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }

          // Generate mock reading with slight randomness
          const mockReading: WaterReading = {
            ph: 7.0 + Math.random() * 0.4, // 7.0-7.4
            temperature: 24 + Math.random() * 3, // 24-27°C
            ec: 400 + Math.floor(Math.random() * 150), // 400-550
            tds: 200 + Math.floor(Math.random() * 75), // 200-275
            salinity: null,
            battery: 80 + Math.floor(Math.random() * 15), // 80-95%
            timestamp: new Date(),
          };

          setLastReading(mockReading);
          setStatus('connected');

          // Convert to form parameters (temperature in user's preferred units)
          if (onParametersDetected) {
            const params: Record<string, string> = {};
            if (mockReading.ph !== null) params['pH'] = mockReading.ph.toFixed(2);
            if (mockReading.temperature !== null) {
              const temp = units === 'imperial'
                ? celsiusToFahrenheit(mockReading.temperature)
                : mockReading.temperature;
              params['Temperature'] = temp.toFixed(1);
            }
            if (mockReading.ec !== null) params['EC'] = mockReading.ec.toString();
            if (mockReading.tds !== null) params['TDS'] = mockReading.tds.toString();
            onParametersDetected(params);
          }

          onReadingComplete?.(mockReading);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Take another reading
  const handleRetakeReading = () => {
    setLastReading(null);
    setStatus('connected');
  };

  // Status display configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          icon: Bluetooth,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          text: 'Ready to connect',
          pulse: false,
        };
      case 'scanning':
        return {
          icon: BluetoothSearching,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          text: 'Searching...',
          pulse: true,
        };
      case 'connecting':
        return {
          icon: BluetoothSearching,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          text: 'Pairing...',
          pulse: true,
        };
      case 'connected':
        return {
          icon: BluetoothConnected,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          text: 'Connected',
          pulse: false,
        };
      case 'ready_to_read':
        return {
          icon: Beaker,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          text: 'Ready',
          pulse: false,
        };
      case 'reading':
        return {
          icon: Droplets,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          text: `Reading... ${readingCountdown}s`,
          pulse: true,
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          text: 'Error',
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Waves className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold">BLE Water Wand</h3>
        <Badge
          variant="secondary"
          className={cn(
            "ml-auto transition-colors",
            statusConfig.bgColor,
            statusConfig.color
          )}
        >
          <StatusIcon className={cn("h-3 w-3 mr-1", statusConfig.pulse && "animate-pulse")} />
          {statusConfig.text}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Connect your water testing wand to automatically read parameters
      </p>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Device Info */}
      <AnimatePresence>
        {device && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <BluetoothConnected className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-sm">{device.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Signal className="h-3 w-3" />
                  <span>{device.rssi} dBm</span>
                  {device.model && (
                    <>
                      <span>•</span>
                      <span>{device.model}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning Progress */}
      <AnimatePresence>
        {status === 'scanning' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm">Searching for water wands...</span>
            </div>
            <Progress value={scanProgress} className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connecting Progress */}
      <AnimatePresence>
        {status === 'connecting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 p-6"
          >
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-sm font-medium">Pairing with your wand...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovered Devices List */}
      <AnimatePresence>
        {discoveredDevices.length > 0 && !device && status === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-sm font-medium">Found Devices</p>
            {discoveredDevices.map((d, index) => (
              <motion.button
                key={d.deviceId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleConnect(d)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Bluetooth className="h-4 w-4 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Signal: {d.rssi} dBm • {d.model}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready to Read Instructions */}
      <AnimatePresence>
        {device && status === 'connected' && !lastReading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Beaker className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Place Wand in Water</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Submerge the probe end of your wand in your aquarium water.
                  Make sure it's at least 2 inches deep for an accurate reading.
                </p>
              </div>
            </div>
            <Button onClick={handleReadyToRead} className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              I'm Ready - Start Reading
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading Countdown */}
      <AnimatePresence>
        {status === 'reading' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4 p-6 bg-blue-500/10 rounded-lg border border-blue-500/20"
          >
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center"
              >
                <Droplets className="h-8 w-8 text-blue-500" />
              </motion.div>
              <div>
                <p className="font-medium">Analyzing Water...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep the wand submerged
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-500">{readingCountdown}s</span>
              </div>
              <Progress value={(10 - readingCountdown) * 10} className="h-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading Results */}
      <AnimatePresence>
        {lastReading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">Reading Complete</span>
              <span className="text-muted-foreground">
                {lastReading.timestamp.toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {lastReading.ph !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="p-3 bg-blue-500/10 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                    <Droplets className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">pH</span>
                  </div>
                  <p className="text-xl font-bold">{lastReading.ph.toFixed(2)}</p>
                </motion.div>
              )}

              {lastReading.temperature !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="p-3 bg-orange-500/10 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-1">
                    <Thermometer className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Temp</span>
                  </div>
                  <p className="text-xl font-bold">{formatTemperature(lastReading.temperature, units)}</p>
                </motion.div>
              )}

              {lastReading.ec !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 bg-green-500/10 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mb-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">EC</span>
                  </div>
                  <p className="text-xl font-bold">{lastReading.ec}</p>
                  <p className="text-xs text-muted-foreground">μS/cm</p>
                </motion.div>
              )}

              {lastReading.tds !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-3 bg-purple-500/10 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                    <Droplets className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">TDS</span>
                  </div>
                  <p className="text-xl font-bold">{lastReading.tds}</p>
                  <p className="text-xs text-muted-foreground">ppm</p>
                </motion.div>
              )}
            </div>

            {lastReading.battery !== null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Battery className="h-3.5 w-3.5" />
                <span>Wand battery: {lastReading.battery}%</span>
              </div>
            )}

            <Button variant="outline" onClick={handleRetakeReading} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Take Another Reading
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons - Only show when disconnected */}
      {!device && status !== 'connecting' && (
        <div className="flex gap-2">
          <Button
            onClick={handleScan}
            disabled={status === 'scanning'}
            className="flex-1"
            variant={status === 'scanning' ? 'secondary' : 'default'}
          >
            {status === 'scanning' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <BluetoothSearching className="h-4 w-4 mr-2" />
                Find Water Wand
              </>
            )}
          </Button>
        </div>
      )}

      {/* Instructions (when not connected) */}
      <AnimatePresence>
        {!device && status === 'disconnected' && discoveredDevices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-2 border-t"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">How to use:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Power on your water testing wand</li>
              <li>Tap "Find Water Wand" to scan for devices</li>
              <li>Select your wand from the list to pair</li>
              <li>Follow the on-screen instructions to test</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WaterWandSection;
