import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, X, Check, Sparkles } from 'lucide-react';
import { LocationService, LocationAutocompleteItem } from '../../lib/location/location-service';
import { SouthAfricanProvince } from '../../lib/supabase/database.types';

export interface SelectedLocationData {
  areaName: string;
  suburb: string | null;
  cityTown: string | null;
  province: SouthAfricanProvince;
  latitude?: number | null;
  longitude?: number | null;
  formattedText: string;
}

interface LocationAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  onSelectLocation: (data: SelectedLocationData) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showLocationButton?: boolean;
  hideLeftIcon?: boolean;
  userCoordinates?: { lat: number; lng: number } | null;
  onCoordinatesDetected?: (coords: { lat: number; lng: number }) => void;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  id = 'location-autocomplete-input',
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Suburb, township, town or city in South Africa...',
  className = '',
  inputClassName = '',
  showLocationButton = true,
  hideLeftIcon = false,
  userCoordinates,
  onCoordinatesDetected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationAutocompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete query
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      // Seed default popular areas when focused but empty
      setSuggestions(LocationService.searchAutocomplete('', 6));
      return;
    }

    const timer = setTimeout(() => {
      const results = LocationService.searchAutocomplete(value.trim(), 8);
      setSuggestions(results);
      setSelectedIndex(-1);
    }, 120);

    return () => clearTimeout(timer);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocationAutocompleteItem) => {
    const formatted = item.suburb && item.suburb !== item.cityTown
      ? `${item.suburb}, ${item.cityTown || item.province}`
      : item.cityTown
      ? `${item.cityTown}, ${item.province}`
      : `${item.areaName}, ${item.province}`;

    onChange(formatted);
    setIsOpen(false);
    setSelectedIndex(-1);

    onSelectLocation({
      areaName: item.areaName,
      suburb: item.suburb,
      cityTown: item.cityTown,
      province: item.province,
      latitude: item.latitude,
      longitude: item.longitude,
      formattedText: formatted,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (onCoordinatesDetected) {
          onCoordinatesDetected(coords);
        }

        // Auto-detect nearest provisional area
        const nearest = LocationService.findOrCreateProvisionalArea('Current Location', {
          latitude: coords.lat,
          longitude: coords.lng,
        });

        const formatted = nearest.suburb && nearest.cityTown
          ? `${nearest.suburb}, ${nearest.cityTown}`
          : nearest.cityTown
          ? `${nearest.cityTown}, ${nearest.province}`
          : `${nearest.areaName}`;

        onChange(formatted);
        onSelectLocation({
          areaName: nearest.areaName,
          suburb: nearest.suburb,
          cityTown: nearest.cityTown,
          province: nearest.province,
          latitude: coords.lat,
          longitude: coords.lng,
          formattedText: formatted,
        });
        setIsOpen(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === 1
            ? 'Location permission was denied. You can search manually by suburb, town, or city.'
            : 'Could not acquire precise location. Please enter your town or suburb.'
        );
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClear = () => {
    onChange('');
    setSuggestions(LocationService.searchAutocomplete('', 6));
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} id={`${id}-wrapper`}>
      <div className="relative flex items-center">
        {!hideLeftIcon && (
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full ${hideLeftIcon ? 'pl-2' : 'pl-10'} pr-20 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176BFF]/20 focus:border-[#176BFF] transition-all shadow-xs ${inputClassName}`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              id={`${id}-clear-btn`}
              onClick={handleClear}
              title="Clear location"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showLocationButton && (
            <button
              type="button"
              id={`${id}-gps-btn`}
              onClick={handleUseMyLocation}
              disabled={isLocating}
              title="Use current location"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                userCoordinates
                  ? 'text-[#176BFF] bg-blue-50 hover:bg-blue-100'
                  : 'text-slate-500 hover:text-[#176BFF] hover:bg-slate-100'
              }`}
            >
              <Navigation
                className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-[#176BFF]' : userCoordinates ? 'fill-[#176BFF]' : ''}`}
              />
              <span className="hidden sm:inline text-[11px]">
                {isLocating ? 'Locating...' : 'Near me'}
              </span>
            </button>
          )}
        </div>
      </div>

      {locationError && (
        <p className="mt-1 text-[11px] text-amber-600 font-medium px-1" id={`${id}-error-msg`}>
          {locationError}
        </p>
      )}

      {/* Autocomplete dropdown suggestions */}
      {isOpen && (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 overflow-y-auto"
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>South Africa Locations</span>
            {value && <span className="text-slate-400 font-normal">Select or press Enter</span>}
          </div>

          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              <p>No matching area found for &ldquo;{value}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  const data: SelectedLocationData = {
                    areaName: value,
                    suburb: value,
                    cityTown: value,
                    province: 'Gauteng',
                    formattedText: value,
                  };
                  onSelectLocation(data);
                  setIsOpen(false);
                }}
                className="mt-2 text-xs text-[#176BFF] hover:underline font-medium inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00E5D4]" />
                Discover practitioners in &ldquo;{value}&rdquo;
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isCustom = item.isCustomDiscovery;

                return (
                  <li
                    key={item.id}
                    id={`${id}-option-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/80 text-[#176BFF]' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`mt-0.5 p-1 rounded-md shrink-0 ${isSelected ? 'bg-[#176BFF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isCustom ? (
                          <Sparkles className="w-3.5 h-3.5 text-[#00E5D4]" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${isSelected ? 'text-[#176BFF]' : 'text-slate-900'}`}>
                            {item.areaName}
                          </span>
                          {item.suburb && item.suburb !== item.areaName && (
                            <span className="text-xs text-slate-500 truncate hidden sm:inline">
                              ({item.suburb})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {item.cityTown ? `${item.cityTown}, ` : ''}{item.province}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 ml-3">
                      {item.practitionerCount > 0 ? (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {item.practitionerCount} indexed
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                          Live discover
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#176BFF]" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
