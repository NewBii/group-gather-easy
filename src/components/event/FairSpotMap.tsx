import { useMemo, useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Participant, FullParticipant } from '@/hooks/useEventData';
import { escapeHtml } from '@/lib/htmlSanitizer';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface FairSpotMapProps {
  participants: Participant[];
  eventId: string;
  fairSpotAddress?: string | null;
}

interface FairSpot {
  lat: number;
  lng: number;
}

// Transport mode weights for fair spot calculation
const TRANSPORT_WEIGHTS: Record<string, number> = {
  car: 1.0,
  public_transit: 1.2,
  bike: 1.5,
  walk: 2.0,
};

const TRANSPORT_COLORS: Record<string, string> = {
  car: '#3b82f6',
  public_transit: '#22c55e',
  bike: '#f59e0b',
  walk: '#8b5cf6',
};

export const FairSpotMap = ({ participants, eventId, fairSpotAddress }: FairSpotMapProps) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [participantsWithLocation, setParticipantsWithLocation] = useState<FullParticipant[]>([]);

  // Fetch location data from participants table (protected by RLS)
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!eventId) return;
      
      const { data, error } = await supabase
        .from('participants_masked')
        .select('id, event_id, name, is_organizer, location_lat, location_lng, transport_mode, created_at')
        .eq('event_id', eventId)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      if (!error && data) {
        setParticipantsWithLocation(data as FullParticipant[]);
      }
    };

    fetchLocationData();
  }, [eventId, participants]); // Re-fetch when participants list changes

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

  // Initialize and update map - only show fair spot marker for privacy
  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || !fairSpot) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Create or reuse map
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [fairSpot.lng, fairSpot.lat],
        zoom: 13,
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    const map = mapRef.current;

    // Wait for map to load before adding markers
    const addMarkers = () => {
      // Only add fair spot marker - individual locations are kept private
      const fairSpotEl = document.createElement('div');
      fairSpotEl.className = 'flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg';
      fairSpotEl.style.background = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))';
      fairSpotEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

      const fairSpotPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 4px;">
          <div style="font-weight: 600; font-size: 14px;">${escapeHtml(t.eventPage?.location?.fairMeetingPoint || 'Fair Meeting Point')}</div>
          ${fairSpotAddress ? `<div style="font-size: 12px; color: #666;">${escapeHtml(fairSpotAddress)}</div>` : ''}
        </div>
      `);

      const fairSpotMarker = new mapboxgl.Marker({ element: fairSpotEl })
        .setLngLat([fairSpot.lng, fairSpot.lat])
        .setPopup(fairSpotPopup)
        .addTo(map);

      markersRef.current.push(fairSpotMarker);

      // Center map on fair spot
      map.setCenter([fairSpot.lng, fairSpot.lat]);
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
  }, [mapboxToken, fairSpot, fairSpotAddress, t]);

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
      public_transit: t.eventPage?.location?.transportModes?.publicTransport || 'Public Transport',
      bike: t.eventPage?.location?.transportModes?.bike || 'Bike',
      walk: t.eventPage?.location?.transportModes?.walk || 'Walk',
    };
    return labels[mode || 'car'] || labels.car;
  };

  // Create a map of participant IDs with location data
  const locationMap = useMemo(() => {
    const map = new Map<string, FullParticipant>();
    participantsWithLocation.forEach(p => map.set(p.id, p));
    return map;
  }, [participantsWithLocation]);

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
              const hasLocation = locationMap.has(participant.id || '');

              return (
                <div 
                  key={participant.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        hasLocation ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      {(participant.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{participant.name}</span>
                  </div>
                  {hasLocation ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {t.eventPage?.location?.locationSaved || 'Shared'}
                    </span>
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