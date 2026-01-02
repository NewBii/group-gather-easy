import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Car, Train, Bike, Footprints, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initialize map when location is selected
  useEffect(() => {
    if (!selectedLocation || !mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // We need to get the token from the edge function response
    // For the preview map, we'll use a simple static approach
    const initMap = async () => {
      try {
        // Get token through a simple API call
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=pk.placeholder&limit=1`);
        // If this fails, the token isn't available client-side
      } catch (e) {
        // Expected - we'll use a fallback display
      }

      // Create simple preview without full map (token is server-side only)
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-muted rounded-lg">
            <div class="text-center p-4">
              <div class="text-2xl mb-2">📍</div>
              <p class="text-sm text-muted-foreground">${selectedLocation.name.split(',')[0]}</p>
              <p class="text-xs text-muted-foreground mt-1">${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}</p>
            </div>
          </div>
        `;
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedLocation]);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setAddress(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setAddress('');
    setSuggestions([]);
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

  return (
    <div className="space-y-4">
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

      {/* Map Preview */}
      {selectedLocation && (
        <div 
          ref={mapContainerRef} 
          className="h-32 rounded-lg border overflow-hidden"
        />
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
