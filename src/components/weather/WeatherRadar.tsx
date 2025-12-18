import React, { useEffect, useState, useRef, useCallback, Component, ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Critical: ensure Leaflet CSS is loaded
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Play, Pause, SkipBack, SkipForward, Radar, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

// Leaflet icon fix is applied inside component useEffect to prevent iOS PWA module-level crashes

interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
}

interface WeatherAlert {
  id: string;
  headline: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  event: string;
  areaDesc: string;
  expires: string;
  description: string;
  instruction: string | null;
  geometry: GeoJSON.Geometry | null;
}

interface WeatherRadarProps {
  latitude: number;
  longitude: number;
  onReady?: () => void;
}

// Local error boundary specifically for the map
interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MapErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void }, MapErrorBoundaryState> {
  constructor(props: { children: ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    console.error('[Radar] MapErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Radar] MapErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-muted/50 gap-3">
          <p className="text-muted-foreground text-sm">Map failed to load</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onRetry();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Severity color mapping
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'Extreme':
      return '#dc2626'; // Red
    case 'Severe':
      return '#ea580c'; // Orange-red
    case 'Moderate':
      return '#f97316'; // Orange
    case 'Minor':
      return '#eab308'; // Yellow
    default:
      return '#6b7280'; // Gray
  }
};

const getSeverityBgClass = (severity: string): string => {
  switch (severity) {
    case 'Extreme':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'Severe':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    case 'Moderate':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    case 'Minor':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

// Removed MapMountTracker - using whenReady callback instead

// Component to update map center when coordinates change - only renders after map is mounted
function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  
  useEffect(() => {
    try {
      map.setView([latitude, longitude], map.getZoom());
    } catch (err) {
      console.error('[Radar] MapUpdater error:', err);
    }
  }, [latitude, longitude, map]);
  
  return null;
}

// Force Leaflet to recalculate tile positions after mount (fixes blank tiles)
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Force map to recalculate after mount and visibility
    const timer = setTimeout(() => {
      try {
        console.log('[Radar] MapResizer: invalidating size');
        map.invalidateSize();
      } catch (err) {
        console.error('[Radar] MapResizer error:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
}

// Radar tile layer component
function RadarLayer({ framePath, opacity }: { framePath: string | null; opacity: number }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    try {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      if (framePath) {
        const tileUrl = `https://tilecache.rainviewer.com${framePath}/256/{z}/{x}/{y}/2/1_1.png`;
        layerRef.current = L.tileLayer(tileUrl, {
          opacity,
          zIndex: 100,
        }).addTo(map);
      }
    } catch (err) {
      console.error('[Radar] RadarLayer error:', err);
    }

    return () => {
      try {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }
      } catch (err) {
        console.error('[Radar] RadarLayer cleanup error:', err);
      }
    };
  }, [framePath, opacity, map]);

  return null;
}

// Enhanced GeoJSON validation with coordinate checking
function isValidGeometry(geom: any): geom is GeoJSON.Geometry {
  if (!geom || typeof geom !== 'object') return false;
  if (!geom.type) return false;
  
  // Check coordinates are valid numbers (not NaN or Infinity)
  const validateCoords = (coords: any): boolean => {
    if (!Array.isArray(coords)) return false;
    
    // Check if it's a coordinate pair [lon, lat]
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
    }
    
    // Otherwise it's a nested array, validate each element
    return coords.every((c) => validateCoords(c));
  };
  
  if (geom.type === 'GeometryCollection') {
    return Array.isArray(geom.geometries) && geom.geometries.every((g: any) => isValidGeometry(g));
  }
  
  return Array.isArray(geom.coordinates) && validateCoords(geom.coordinates);
}

// Alert polygons layer - with hardened error handling
function AlertsLayer({ alerts, showAlerts }: { alerts: WeatherAlert[]; showAlerts: boolean }) {
  if (!showAlerts || !alerts || alerts.length === 0) return null;

  return (
    <>
      {alerts.map((alert) => {
        // Validate geometry before rendering
        if (!alert.geometry) {
          console.log('[Radar] AlertsLayer: skipping alert without geometry:', alert.id);
          return null;
        }
        
        if (!isValidGeometry(alert.geometry)) {
          console.log('[Radar] AlertsLayer: skipping alert with invalid geometry:', alert.id);
          return null;
        }
        
        try {
          const geoJsonData: GeoJSON.Feature = {
            type: 'Feature',
            properties: { severity: alert.severity, event: alert.event },
            geometry: alert.geometry,
          };

          return (
            <GeoJSON
              key={alert.id}
              data={geoJsonData}
              style={{
                color: getSeverityColor(alert.severity),
                weight: 2,
                opacity: 0.8,
                fillColor: getSeverityColor(alert.severity),
                fillOpacity: 0.25,
                dashArray: '5, 5',
              }}
            />
          );
        } catch (err) {
          console.error('[Radar] AlertsLayer: Failed to render alert geometry:', alert.id, err);
          return null;
        }
      })}
    </>
  );
}

export function WeatherRadar({ latitude, longitude, onReady }: WeatherRadarProps) {
  console.log('[Radar] WeatherRadar component rendering', { latitude, longitude });
  
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [mapMounted, setMapMounted] = useState(false); // Staged rendering: track when map is mounted
  const [stage2Ready, setStage2Ready] = useState(false); // Staged: RadarLayer etc.
  const [stage3Ready, setStage3Ready] = useState(false); // Staged: AlertsLayer
  const [retryKey, setRetryKey] = useState(0); // Key to force re-mount on retry
  const intervalRef = useRef<number | null>(null);

  // Alert state
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // whenReady callback - fires when MapContainer is fully initialized
  const handleMapReady = useCallback(() => {
    console.log('[Radar] whenReady fired - map is initialized');
    setMapMounted(true);
  }, []);

  // Staged rendering: delay stage2 components after map mounts
  useEffect(() => {
    if (mapMounted) {
      console.log('[Radar] Map mounted, scheduling stage2 in 300ms');
      const timer = setTimeout(() => {
        console.log('[Radar] Stage2 ready (RadarLayer, MapUpdater, MapResizer)');
        setStage2Ready(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mapMounted]);

  // Staged rendering: delay stage3 (alerts) after stage2
  useEffect(() => {
    if (stage2Ready && !alertsLoading) {
      console.log('[Radar] Stage2 ready + alerts loaded, scheduling stage3 in 200ms');
      const timer = setTimeout(() => {
        console.log('[Radar] Stage3 ready (AlertsLayer)');
        setStage3Ready(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [stage2Ready, alertsLoading]);

  // Handle retry from error boundary
  const handleRetry = useCallback(() => {
    console.log('[Radar] handleRetry called - resetting state');
    setMapMounted(false);
    setStage2Ready(false);
    setStage3Ready(false);
    setRetryKey(prev => prev + 1);
  }, []);

  // Fix Leaflet default marker icon inside useEffect to prevent iOS PWA module-level crashes
  useEffect(() => {
    console.log('[Radar] Configuring Leaflet icons...');
    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      console.log('[Radar] Leaflet icons configured, setting leafletReady = true');
      setLeafletReady(true);
    } catch (err) {
      console.error('[Radar] Failed to configure Leaflet icons:', err);
      // Still mark as ready - marker will just use default broken icon
      setLeafletReady(true);
    }
  }, []);

  // Signal ready when MAP is mounted (not just leaflet configured)
  // This ensures the MapContainer has fully initialized before clearing timeout
  useEffect(() => {
    if (mapMounted && onReady) {
      console.log('[Radar] Map is mounted, signaling onReady');
      onReady();
    }
  }, [mapMounted, onReady]);

  // Fetch radar frames from RainViewer
  useEffect(() => {
    const fetchRadarFrames = async () => {
      console.log('[Radar] Starting RainViewer fetch...');
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!response.ok) throw new Error('Failed to fetch radar data');
        
        const data: RainViewerResponse = await response.json();
        const allFrames = [...data.radar.past, ...data.radar.nowcast];
        console.log('[Radar] RainViewer fetch complete, frames:', allFrames.length);
        setFrames(allFrames);
        setCurrentFrameIndex(data.radar.past.length - 1);
      } catch (err) {
        setError('Unable to load radar data');
        console.error('[Radar] Radar fetch error:', err);
      } finally {
        console.log('[Radar] Setting isLoading = false');
        setIsLoading(false);
      }
    };

    fetchRadarFrames();
    const refreshInterval = setInterval(fetchRadarFrames, 10 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Fetch weather alerts from NWS API (US only)
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        const response = await fetch(
          `https://api.weather.gov/alerts/active?point=${latitude},${longitude}&status=actual`,
          { headers: { 'User-Agent': 'AllyByWaiter/1.0' } }
        );
        
        if (!response.ok) {
          // NWS API only works in US - graceful fallback
          if (response.status === 404) {
            setAlerts([]);
            return;
          }
          throw new Error('Failed to fetch alerts');
        }
        
        const data = await response.json();
        const parsedAlerts: WeatherAlert[] = (data.features || []).map((feature: any) => ({
          id: feature.id,
          headline: feature.properties.headline || feature.properties.event,
          severity: feature.properties.severity || 'Unknown',
          event: feature.properties.event,
          areaDesc: feature.properties.areaDesc,
          expires: feature.properties.expires,
          description: feature.properties.description || '',
          instruction: feature.properties.instruction,
          geometry: feature.geometry,
        }));
        
        // Sort by severity
        const severityOrder = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
        parsedAlerts.sort((a, b) => 
          severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
        );
        
        setAlerts(parsedAlerts);
      } catch (err) {
        console.error('Alert fetch error:', err);
        setAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
    // Refresh alerts every 5 minutes
    const refreshInterval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [latitude, longitude]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, 500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, frames.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handlePrevFrame = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  }, [frames.length]);

  const handleNextFrame = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
  }, [frames.length]);

  const handleSliderChange = useCallback((value: number[]) => {
    setIsPlaying(false);
    setCurrentFrameIndex(value[0]);
  }, []);

  const currentFrame = frames[currentFrameIndex];
  const frameTime = currentFrame ? new Date(currentFrame.time * 1000) : null;
  const isPastFrame = currentFrameIndex < frames.length - (frames.length > 0 ? Math.floor(frames.length / 3) : 0);

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radar className="h-5 w-5" />
            Weather Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render map until Leaflet is fully configured (critical for iOS PWA)
  if (!leafletReady) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radar className="h-5 w-5" />
            Weather Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 md:h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Initializing map...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radar className="h-5 w-5" />
            Weather Radar
          </CardTitle>
          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <Badge 
                variant="outline" 
                className={`${getSeverityBgClass(alerts[0]?.severity)} text-xs`}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alerts.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlerts(!showAlerts)}
              className={`h-8 px-2 ${showAlerts ? 'text-primary' : 'text-muted-foreground'}`}
              title={showAlerts ? 'Hide alerts on map' : 'Show alerts on map'}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map Container with Error Boundary */}
        <div className="relative h-64 md:h-80">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-[1000]">
              <div className="animate-pulse text-muted-foreground">Loading radar...</div>
            </div>
          )}
          <MapErrorBoundary onRetry={handleRetry}>
            <MapContainer
              key={retryKey}
              center={[latitude, longitude]}
              zoom={7}
              scrollWheelZoom={false}
              className="h-full w-full z-0"
              attributionControl={false}
              whenReady={handleMapReady}
            >
              {/* Stage 1: Essential components - always render */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <Marker position={[latitude, longitude]} />
              
              {/* Stage 2: Components using useMap() - render with delay after map mounts */}
              {stage2Ready && <RadarLayer framePath={currentFrame?.path ?? null} opacity={0.7} />}
              {stage2Ready && <MapUpdater latitude={latitude} longitude={longitude} />}
              {stage2Ready && <MapResizer />}
              
              {/* Stage 3: Alert layer - render after stage2 AND alerts loaded */}
              {stage3Ready && <AlertsLayer alerts={alerts} showAlerts={showAlerts} />}
            </MapContainer>
          </MapErrorBoundary>

          {/* Timestamp Badge */}
          {frameTime && (
            <div className="absolute top-2 right-2 z-[1000] bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium">
              <span className={isPastFrame ? 'text-muted-foreground' : 'text-primary'}>
                {isPastFrame ? 'Past' : 'Forecast'}
              </span>
              {' · '}
              {format(frameTime, 'h:mm a')}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevFrame}
              disabled={frames.length === 0}
              className="h-8 w-8"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              disabled={frames.length === 0}
              className="h-8 w-8"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextFrame}
              disabled={frames.length === 0}
              className="h-8 w-8"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Slider
                value={[currentFrameIndex]}
                min={0}
                max={Math.max(0, frames.length - 1)}
                step={1}
                onValueChange={handleSliderChange}
                disabled={frames.length === 0}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Light</span>
            <div className="flex h-2">
              <div className="w-4 bg-[#00ff00] rounded-l" />
              <div className="w-4 bg-[#ffff00]" />
              <div className="w-4 bg-[#ff9900]" />
              <div className="w-4 bg-[#ff0000]" />
              <div className="w-4 bg-[#cc00cc] rounded-r" />
            </div>
            <span>Heavy</span>
          </div>
        </div>

        {/* Alert List Panel */}
        {alerts.length > 0 && (
          <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between px-4 py-3 border-t border-border/50 rounded-none h-auto"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">
                    {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {alertsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`${getSeverityBgClass(alert.severity)} text-xs`}
                          >
                            {alert.severity}
                          </Badge>
                          <span className="font-medium text-sm truncate">{alert.event}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {alert.headline}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Areas:</span> {alert.areaDesc}
                    </div>
                    {alert.expires && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Expires:</span>{' '}
                        {format(new Date(alert.expires), 'MMM d, h:mm a')}
                      </div>
                    )}
                    {alert.instruction && (
                      <div className="text-xs bg-muted/50 rounded p-2 mt-2">
                        <span className="font-medium">Instructions:</span>{' '}
                        <span className="text-muted-foreground">{alert.instruction}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {alertsLoading && alerts.length === 0 && (
          <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground text-center">
            Checking for weather alerts...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
