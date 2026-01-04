import { MapPin, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";

interface LocationMapPreviewProps {
  latitude: number;
  longitude: number;
  locationName: string;
  onUpdateLocation?: () => void;
}

const formatCoordinate = (value: number, isLatitude: boolean): string => {
  const direction = isLatitude 
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
};

export function LocationMapPreview({ 
  latitude, 
  longitude, 
  locationName,
  onUpdateLocation 
}: LocationMapPreviewProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // OpenStreetMap embed URL with marker
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  
  // External maps URL - detect iOS for Apple Maps
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const externalMapUrl = isIOS 
    ? `maps://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(locationName)}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const coordinatesText = `${formatCoordinate(latitude, true)}, ${formatCoordinate(longitude, false)}`;

  const handleCopyCoordinates = async () => {
    const success = await copyToClipboard(`${latitude}, ${longitude}`);
    if (success) {
      setCopied(true);
      toast({
        title: t('common.copied'),
        description: coordinatesText,
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: t('aquarium.coordinates'),
        description: `${latitude}, ${longitude}`,
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden w-full max-w-sm">
      {/* Map iframe */}
      <div className="relative w-full h-36 bg-muted">
        <iframe
          src={mapEmbedUrl}
          className="w-full h-full border-0"
          title="Location map"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {/* Location details */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium text-sm truncate">{locationName}</span>
        </div>
        
        <button
          onClick={handleCopyCoordinates}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {coordinatesText}
        </button>
        
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <a href={externalMapUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1.5" />
              {t('aquarium.viewInMaps')}
            </a>
          </Button>
          
          {onUpdateLocation && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={onUpdateLocation}
            >
              {t('aquarium.updateLocation')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
