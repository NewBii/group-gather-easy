import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Car, Train, Bike, Footprints, Loader2, X, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationSuggestion {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface LocationInputProps {
  onConfirm: (lat: number, lng: number, address: string, transportMode: string) => void;
  onCancel?: () => void;
  initialTransportMode?: string;
}

export const LocationInput = ({ onConfirm, onCancel, initialTransportMode = 'car' }: LocationInputProps) => {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [transportMode, setTransportMode] = useState(initialTransportMode);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'map'>('search');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Mapbox token on mount
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

  // Initialize map when token is available and tab is 'map'
  useEffect(() => {
    if (!mapboxToken || activeTab !== 'map' || !mapContainerRef.current) return;
    if (mapRef.current) return; // Already initialized

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.3522, 48.8566], // Paris default
      zoom: 5,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create draggable marker
    const marker = new mapboxgl.Marker({ draggable: true, color: 'hsl(var(--primary))' });

    // Handle map click
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]).addTo(map);
      await reverseGeocodeAndSelect(lat, lng);
    });

    // Handle marker drag end
    marker.on('dragend', async () => {
      const lngLat = marker.getLngLat();
      await reverseGeocodeAndSelect(lngLat.lat, lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // If we already have a selected location, show it
    if (selectedLocation) {
      marker.setLngLat([selectedLocation.lng, selectedLocation.lat]).addTo(map);
      map.flyTo({ center: [selectedLocation.lng, selectedLocation.lat], zoom: 14 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapboxToken, activeTab]);

  // Update marker when switching tabs with existing selection
  useEffect(() => {
    if (activeTab === 'map' && mapRef.current && markerRef.current && selectedLocation) {
      markerRef.current.setLngLat([selectedLocation.lng, selectedLocation.lat]).addTo(mapRef.current);
      mapRef.current.flyTo({ center: [selectedLocation.lng, selectedLocation.lat], zoom: 14 });
    }
  }, [activeTab, selectedLocation]);

  const reverseGeocodeAndSelect = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('reverse-geocode', {
        body: { lat, lng }
      });
      
      const addressName = error ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : data.address;
      
      setSelectedLocation({
        id: `map-${Date.now()}`,
        name: addressName,
        lat,
        lng
      });
      setAddress(addressName);
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setSelectedLocation({
        id: `map-${Date.now()}`,
        name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng
      });
    }
  };

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: query },
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (address.length >= 2 && !selectedLocation) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(address);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [address, selectedLocation, fetchSuggestions]);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setAddress(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);

    // Update map marker if map is active
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([suggestion.lng, suggestion.lat]).addTo(mapRef.current);
      mapRef.current.flyTo({ center: [suggestion.lng, suggestion.lat], zoom: 14 });
    }
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setAddress('');
    setSuggestions([]);
    if (markerRef.current) {
      markerRef.current.remove();
    }
  };

  const handleConfirm = async () => {
    if (!selectedLocation) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedLocation.lat, selectedLocation.lng, selectedLocation.name, transportMode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLngLat([longitude, latitude]).addTo(mapRef.current);
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
        }
        
        await reverseGeocodeAndSelect(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'search' | 'map')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t.eventPage?.location?.searchByAddress || 'Search'}
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t.eventPage?.location?.selectOnMap || 'Select on map'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-3 mt-3">
          {/* Address Input */}
          <div className="relative">
            <Label>{t.eventPage.location.yourLocation}</Label>
            <div className="relative mt-1.5">
              <Input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (selectedLocation) {
                    setSelectedLocation(null);
                  }
                }}
                placeholder={t.eventPage.location.enterAddress || t.eventPage.location.locationPlaceholder}
                className="pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {selectedLocation && !isSearching && (
                <button
                  onClick={handleClearSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2 text-sm"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{suggestion.name}</span>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && suggestions.length === 0 && !isSearching && address.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                {t.eventPage.location.noResults || 'No addresses found'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-3 mt-3">
          {isLoadingToken ? (
            <div className="h-64 flex items-center justify-center bg-muted rounded-md">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : mapboxToken ? (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="flex items-center gap-2"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {t.eventPage?.location?.useMyLocation || 'Use my location'}
                </Button>
              </div>
              <div 
                ref={mapContainerRef} 
                className="h-64 rounded-md overflow-hidden border"
              />
              <p className="text-xs text-muted-foreground">
                {t.eventPage?.location?.clickToSelect || 'Click on the map to select your location'}
              </p>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-muted rounded-md text-muted-foreground">
              {t.eventPage?.location?.mapLoadError || 'Unable to load map'}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm">{selectedLocation.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-6 px-2 text-xs"
            >
              {t.eventPage?.location?.change || 'Change'}
            </Button>
          </div>
        </div>
      )}

      {/* Transport Mode */}
      <div>
        <Label>{t.eventPage.location.transportMode}</Label>
        <Select value={transportMode} onValueChange={setTransportMode}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                {t.eventPage.location.transportModes.car}
              </div>
            </SelectItem>
            <SelectItem value="public_transport">
              <div className="flex items-center gap-2">
                <Train className="h-4 w-4" />
                {t.eventPage.location.transportModes.publicTransport}
              </div>
            </SelectItem>
            <SelectItem value="bike">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4" />
                {t.eventPage.location.transportModes.bike}
              </div>
            </SelectItem>
            <SelectItem value="walk">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4" />
                {t.eventPage.location.transportModes.walk}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleConfirm} 
          disabled={!selectedLocation || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {t.eventPage.location.confirmLocation || t.eventPage.location.saveLocation}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        )}
      </div>
    </div>
  );
};
