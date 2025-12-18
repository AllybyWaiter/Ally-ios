import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Radar } from 'lucide-react';
import { format } from 'date-fns';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface WeatherRadarProps {
  latitude: number;
  longitude: number;
}

// Component to update map center when coordinates change
function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  
  return null;
}

// Radar tile layer component
function RadarLayer({ framePath, opacity }: { framePath: string | null; opacity: number }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
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

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [framePath, opacity, map]);

  return null;
}

export function WeatherRadar({ latitude, longitude }: WeatherRadarProps) {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Fetch radar frames from RainViewer
  useEffect(() => {
    const fetchRadarFrames = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!response.ok) throw new Error('Failed to fetch radar data');
        
        const data: RainViewerResponse = await response.json();
        const allFrames = [...data.radar.past, ...data.radar.nowcast];
        setFrames(allFrames);
        setCurrentFrameIndex(data.radar.past.length - 1); // Start at most recent past frame
      } catch (err) {
        setError('Unable to load radar data');
        console.error('Radar fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRadarFrames();
    // Refresh radar data every 10 minutes
    const refreshInterval = setInterval(fetchRadarFrames, 10 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

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

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Radar className="h-5 w-5" />
          Weather Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map Container */}
        <div className="relative h-64 md:h-80">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-[1000]">
              <div className="animate-pulse text-muted-foreground">Loading radar...</div>
            </div>
          )}
          <MapContainer
            center={[latitude, longitude]}
            zoom={7}
            scrollWheelZoom={false}
            className="h-full w-full z-0"
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            <RadarLayer 
              framePath={currentFrame?.path ?? null} 
              opacity={0.7} 
            />
            <Marker position={[latitude, longitude]} />
            <MapUpdater latitude={latitude} longitude={longitude} />
          </MapContainer>

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
      </CardContent>
    </Card>
  );
}
