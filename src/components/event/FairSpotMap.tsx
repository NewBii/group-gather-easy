import { useMemo, useEffect, useRef, useState } from 'react';
import { MapPin, Car, Train, Bike, Footprints, Navigation, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Participant } from '@/hooks/useEventData';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface FairSpotMapProps {
  participants: Participant[];
  fairSpotAddress?: string | null;
}

interface FairSpot {
  lat: number;
  lng: number;
}

// Transport mode weights for fair spot calculation
const TRANSPORT_WEIGHTS: Record<string, number> = {
  car: 1.0,
  public_transport: 1.2,
  bike: 1.5,
  walk: 2.0,
};

const TRANSPORT_COLORS: Record<string, string> = {
  car: '#3b82f6',
  public_transport: '#22c55e',
  bike: '#f59e0b',
  walk: '#8b5cf6',
};

export const FairSpotMap = ({ participants, fairSpotAddress }: FairSpotMapProps) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const participantsWithLocation = useMemo(() => 
    participants.filter(p => p.location_lat != null && p.location_lng != null),
    [participants]
  );

  // Calculate fair meeting point using weighted centroid
  const fairSpot = useMemo((): FairSpot | null => {
    if (participantsWithLocation.length < 1) return null;

    let totalWeightedLat = 0;
    let totalWeightedLng = 0;
    let totalWeight = 0;

    participantsWithLocation.forEach(p => {
      const weight = TRANSPORT_WEIGHTS[p.transport_mode || 'car'] || 1.0;
      totalWeightedLat += (p.location_lat || 0) * weight;
      totalWeightedLng += (p.location_lng || 0) * weight;
      totalWeight += weight;
    });

    return {
      lat: totalWeightedLat / totalWeight,
      lng: totalWeightedLng / totalWeight,
    };
  }, [participantsWithLocation]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      } finally {
        setIsLoadingToken(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize and update map
  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || participantsWithLocation.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Create or reuse map
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: fairSpot ? [fairSpot.lng, fairSpot.lat] : [2.3522, 48.8566],
        zoom: 10,
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    const map = mapRef.current;

    // Wait for map to load before adding markers
    const addMarkers = () => {
      // Add participant markers
      participantsWithLocation.forEach(p => {
        const color = TRANSPORT_COLORS[p.transport_mode || 'car'] || '#6b7280';
        
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer';
        el.style.backgroundColor = color;
        el.innerHTML = `<span style="color: white; font-size: 12px; font-weight: bold;">${p.name.charAt(0).toUpperCase()}</span>`;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 4px;">
            <div style="font-weight: 600; font-size: 14px;">${p.name}</div>
            <div style="font-size: 12px; color: #666;">${getTransportLabel(p.transport_mode)}</div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([p.location_lng as number, p.location_lat as number])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Add fair spot marker
      if (fairSpot) {
        const fairSpotEl = document.createElement('div');
        fairSpotEl.className = 'flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg';
        fairSpotEl.style.background = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))';
        fairSpotEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

        const fairSpotPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 4px;">
            <div style="font-weight: 600; font-size: 14px;">${t.eventPage?.location?.fairMeetingPoint || 'Fair Meeting Point'}</div>
            ${fairSpotAddress ? `<div style="font-size: 12px; color: #666;">${fairSpotAddress}</div>` : ''}
          </div>
        `);

        const fairSpotMarker = new mapboxgl.Marker({ element: fairSpotEl })
          .setLngLat([fairSpot.lng, fairSpot.lat])
          .setPopup(fairSpotPopup)
          .addTo(map);

        markersRef.current.push(fairSpotMarker);
      }

      // Fit bounds to show all markers
      if (participantsWithLocation.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        participantsWithLocation.forEach(p => {
          bounds.extend([p.location_lng as number, p.location_lat as number]);
        });
        if (fairSpot) {
          bounds.extend([fairSpot.lng, fairSpot.lat]);
        }
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [mapboxToken, participantsWithLocation, fairSpot, fairSpotAddress, t]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const getTransportLabel = (mode: string | null): string => {
    const labels: Record<string, string> = {
      car: t.eventPage?.location?.transportModes?.car || 'Car',
      public_transport: t.eventPage?.location?.transportModes?.publicTransport || 'Public Transport',
      bike: t.eventPage?.location?.transportModes?.bike || 'Bike',
      walk: t.eventPage?.location?.transportModes?.walk || 'Walk',
    };
    return labels[mode || 'car'] || labels.car;
  };

  const getTransportIcon = (mode: string | null) => {
    switch (mode) {
      case 'car': return <Car className="h-3 w-3" />;
      case 'public_transport': return <Train className="h-3 w-3" />;
      case 'bike': return <Bike className="h-3 w-3" />;
      case 'walk': return <Footprints className="h-3 w-3" />;
      default: return <Car className="h-3 w-3" />;
    }
  };

  const getTransportColor = (mode: string | null) => {
    switch (mode) {
      case 'car': return 'bg-blue-500';
      case 'public_transport': return 'bg-green-500';
      case 'bike': return 'bg-yellow-500';
      case 'walk': return 'bg-violet-500';
      default: return 'bg-blue-500';
    }
  };

  if (participantsWithLocation.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-8 text-center">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {t.eventPage.location.waitingForLocations?.replace('{count}', participants.length.toString()) || 
              `Waiting for participants to share their location`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            {t.eventPage?.location?.fairMeetingPoint || 'Fair Meeting Point'}
          </CardTitle>
          {fairSpotAddress && (
            <p className="text-sm text-muted-foreground">{fairSpotAddress}</p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingToken ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : mapboxToken ? (
            <div ref={mapContainerRef} className="h-64 rounded-b-lg" />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              {t.eventPage?.location?.mapLoadError || 'Unable to load map'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t.eventPage?.location?.participantsOnMap || 'Participants'} ({participantsWithLocation.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {participants.map((participant) => {
              const hasLocation = participant.location_lat != null;

              return (
                <div 
                  key={participant.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        hasLocation ? getTransportColor(participant.transport_mode) : 'bg-gray-300'
                      }`}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{participant.name}</span>
                  </div>
                  {hasLocation ? (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs ${getTransportColor(participant.transport_mode)}`}>
                      {getTransportIcon(participant.transport_mode)}
                      <span>{getTransportLabel(participant.transport_mode)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t.eventPage?.location?.locationPending || 'Pending'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status messages */}
      {participants.length > participantsWithLocation.length && (
        <p className="text-sm text-muted-foreground text-center">
          {t.eventPage.location.waitingForLocations?.replace(
            '{count}', 
            (participants.length - participantsWithLocation.length).toString()
          )}
        </p>
      )}

      {participants.length === participantsWithLocation.length && participants.length > 0 && (
        <p className="text-sm text-green-600 text-center font-medium">
          ✓ {t.eventPage.location.everyoneLocated}
        </p>
      )}
    </div>
  );
};
