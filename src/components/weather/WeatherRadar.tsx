import React, { useEffect, useState, useRef, useCallback, Component, ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, useMap, GeoJSON } from 'react-leaflet';
import type { Geometry, Position, GeometryCollection } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Critical: ensure Leaflet CSS is loaded
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
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

interface NwsAlertFeature {
  id: string;
  properties?: {
    headline?: string;
    severity?: WeatherAlert['severity'];
    event?: string;
    areaDesc?: string;
    expires?: string;
    description?: string;
    instruction?: string | null;
  };
  geometry?: GeoJSON.Geometry | null;
}

interface NwsAlertsResponse {
  features?: NwsAlertFeature[];
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
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Error already captured by getDerivedStateFromError
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
      logger.error('[Radar] MapUpdater error:', err);
    }
  }, [latitude, longitude, map]);
  
  return null;
}

// Force Leaflet to recalculate tile positions after mount (fixes blank tiles)
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    // Use ResizeObserver instead of multiple timeouts for reliable size detection
    const container = map.getContainer();
    
    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        logger.error('[Radar] MapResizer error:', err);
      }
    });
    
    resizeObserver.observe(container);
    
    // Initial invalidation after mount
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        logger.error('[Radar] MapResizer initial error:', err);
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
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
      logger.error('[Radar] RadarLayer error:', err);
    }

    return () => {
      try {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }
      } catch (err) {
        logger.error('[Radar] RadarLayer cleanup error:', err);
      }
    };
  }, [framePath, opacity, map]);

  return null;
}

// Type for coordinate validation - can be a Position or nested arrays of positions
type CoordinateArray = Position | Position[] | Position[][] | Position[][][];

// Enhanced GeoJSON validation with coordinate checking
function isValidGeometry(geom: unknown): geom is Geometry {
  if (!geom || typeof geom !== 'object') return false;

  const geometry = geom as { type?: string; coordinates?: CoordinateArray; geometries?: unknown[] };
  if (!geometry.type) return false;

  // Check coordinates are valid numbers (not NaN or Infinity)
  const validateCoords = (coords: CoordinateArray): boolean => {
    if (!Array.isArray(coords)) return false;

    // Check if it's a coordinate pair [lon, lat]
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
    }

    // Otherwise it's a nested array, validate each element
    return (coords as CoordinateArray[]).every((c) => validateCoords(c));
  };

  if (geometry.type === 'GeometryCollection') {
    const geoCollection = geometry as GeometryCollection;
    return Array.isArray(geoCollection.geometries) && geoCollection.geometries.every((g) => isValidGeometry(g));
  }

  return Array.isArray(geometry.coordinates) && validateCoords(geometry.coordinates);
}

// Alert polygons layer - with hardened error handling
function AlertsLayer({ alerts, showAlerts }: { alerts: WeatherAlert[]; showAlerts: boolean }) {
  if (!showAlerts || !alerts || alerts.length === 0) return null;

  return (
    <>
      {alerts.map((alert) => {
        // Validate geometry before rendering
        if (!alert.geometry || !isValidGeometry(alert.geometry)) {
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
          logger.error('[Radar] AlertsLayer: Failed to render alert geometry:', alert.id, err);
          return null;
        }
      })}
    </>
  );
}

export function WeatherRadar({ latitude, longitude, onReady }: WeatherRadarProps) {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Alert state
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // whenReady callback - fires when MapContainer is fully initialized
  const handleMapReady = useCallback(() => {
    setMapMounted(true);
  }, []);

  // Handle retry from error boundary
  const handleRetry = useCallback(() => {
    setMapMounted(false);
    setRetryKey(prev => prev + 1);
  }, []);

  // Fix Leaflet default marker icon inside useEffect to prevent iOS PWA module-level crashes
  useEffect(() => {
    try {
      // Check if _getIconUrl exists before deleting to avoid strict mode errors
      // Leaflet's internal prototype has _getIconUrl which isn't in the type definitions
      const proto = L.Icon.Default.prototype as typeof L.Icon.Default.prototype & { _getIconUrl?: unknown };
      if (proto._getIconUrl) {
        delete proto._getIconUrl;
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setLeafletReady(true);
    } catch (err) {
      logger.error('[Radar] Failed to configure Leaflet icons:', err);
      setLeafletReady(true);
    }
  }, []);

  // Signal ready earlier - when leafletReady is true (don't wait for full map mount)
  // This prevents LazyLoadWithTimeout from timing out while waiting for tiles
  useEffect(() => {
    if (leafletReady && onReady) {
      onReady();
    }
  }, [leafletReady, onReady]);

  // Fetch radar frames (via backend proxy for reliability)
  useEffect(() => {
    let isMounted = true;

    const fetchRadarFrames = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        // Prefer backend proxy to avoid CORS and network filtering issues
        let raw: RainViewerResponse | null = null;

        try {
          const { data: proxyData, error: proxyError } = await supabase.functions.invoke('get-radar-frames');

          if (proxyError) {
            logger.warn('[Radar] Proxy error:', proxyError.message || proxyError);
          }

          if (!proxyError && proxyData?.data) {
            raw = proxyData.data as RainViewerResponse;
            logger.log('[Radar] Loaded from proxy');
          }
        } catch (proxyErr) {
          logger.warn('[Radar] Proxy fetch failed:', proxyErr instanceof Error ? proxyErr.message : proxyErr);
        }

        // Fallback to direct API call if proxy failed
        if (!raw) {
          logger.log('[Radar] Trying direct RainViewer API...');
          const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`RainViewer API error (${response.status})`);
          raw = (await response.json()) as RainViewerResponse;
          logger.log('[Radar] Loaded from direct API');
        }

        if (!isMounted) return;
        const allFrames = [...raw.radar.past, ...raw.radar.nowcast];
        setFrames(allFrames);
        setCurrentFrameIndex(raw.radar.past.length - 1);
      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        setError(`Unable to load radar data: ${errorMessage}`);
        logger.error('[Radar] Radar fetch error:', err instanceof Error ? err.message : err, err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRadarFrames();
    const refreshInterval = setInterval(fetchRadarFrames, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  // Fetch weather alerts from NWS API (US only)
  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        if (isMounted) setAlertsLoading(true);
        const response = await fetch(
          `https://api.weather.gov/alerts/active?point=${latitude},${longitude}&status=actual`,
          { headers: { 'User-Agent': 'AllyByWaiter/1.0' } }
        );

        if (!response.ok) {
          // NWS API only works in US - graceful fallback
          if (response.status === 404) {
            if (isMounted) setAlerts([]);
            return;
          }
          throw new Error('Failed to fetch alerts');
        }

        const data: NwsAlertsResponse = await response.json();
        const parsedAlerts: WeatherAlert[] = (data.features || []).map((feature) => ({
          id: feature.id,
          headline: feature.properties?.headline || feature.properties?.event || 'Weather Alert',
          severity: feature.properties?.severity || 'Unknown',
          event: feature.properties?.event || 'Unknown event',
          areaDesc: feature.properties?.areaDesc || 'Unknown area',
          expires: feature.properties?.expires || '',
          description: feature.properties?.description || '',
          instruction: feature.properties?.instruction ?? null,
          geometry: feature.geometry ?? null,
        }));

        // Sort by severity
        const severityOrder = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
        parsedAlerts.sort((a, b) =>
          severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
        );

        if (isMounted) setAlerts(parsedAlerts);
      } catch (err) {
        logger.error('Alert fetch error:', err);
        if (isMounted) setAlerts([]);
      } finally {
        if (isMounted) setAlertsLoading(false);
      }
    };

    fetchAlerts();
    // Refresh alerts every 5 minutes
    const refreshInterval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [latitude, longitude]);

  // Animation loop - pause when tab is hidden to save CPU
  // Use ref to track visibility listener for proper cleanup
  const visibilityListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Always clean up previous listener first to prevent accumulation
    if (visibilityListenerRef.current) {
      document.removeEventListener('visibilitychange', visibilityListenerRef.current);
      visibilityListenerRef.current = null;
    }

    isPlayingRef.current = isPlaying;

    if (isPlaying && frames.length > 0) {
      const handleVisibilityChange = () => {
        if (document.hidden && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        } else if (!document.hidden && isPlayingRef.current) {
          intervalRef.current = window.setInterval(() => {
            setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
          }, 500);
        }
      };

      visibilityListenerRef.current = handleVisibilityChange;
      document.addEventListener('visibilitychange', handleVisibilityChange);

      intervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, 500);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (visibilityListenerRef.current) {
        document.removeEventListener('visibilitychange', visibilityListenerRef.current);
        visibilityListenerRef.current = null;
      }
    };
  }, [isPlaying, frames.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handlePrevFrame = useCallback(() => {
    if (frames.length === 0) return;
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  }, [frames.length]);

  const handleNextFrame = useCallback(() => {
    if (frames.length === 0) return;
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
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <Marker position={[latitude, longitude]} />
              
              {/* Components using useMap() - render after map is mounted */}
              {mapMounted && <RadarLayer framePath={currentFrame?.path ?? null} opacity={0.7} />}
              {mapMounted && <MapUpdater latitude={latitude} longitude={longitude} />}
              {mapMounted && <MapResizer />}
              {mapMounted && <AlertsLayer alerts={alerts} showAlerts={showAlerts} />}
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
