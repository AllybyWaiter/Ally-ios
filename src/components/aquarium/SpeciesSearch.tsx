/**
 * Species Search Autocomplete
 * 
 * Provides fuzzy search for fish species with compatibility indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Fish, Search, Check } from 'lucide-react';
import { searchFishSpecies } from '@/infrastructure/queries/fishSpecies';
import type { FishSpecies } from '@/lib/fishCompatibility';
import { cn } from '@/lib/utils';

interface SpeciesSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSpeciesSelect: (species: FishSpecies | null) => void;
  aquariumType?: string;
  placeholder?: string;
  disabled?: boolean;
}

function getTemperamentBadge(temperament: string) {
  switch (temperament) {
    case 'peaceful':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Peaceful</Badge>;
    case 'semi-aggressive':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Semi Aggressive</Badge>;
    case 'aggressive':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Aggressive</Badge>;
    default:
      return null;
  }
}

export function SpeciesSearch({
  value,
  onChange,
  onSpeciesSelect,
  aquariumType,
  placeholder = "Search species (e.g., Neon Tetra)",
  disabled = false,
}: SpeciesSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const { data: species, isLoading } = useQuery({
    queryKey: ['fishSpecies', 'search', debouncedQuery, aquariumType],
    queryFn: () => searchFishSpecies(debouncedQuery, aquariumType, 8),
    enabled: debouncedQuery.length >= 2,
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!species || species.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < species.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < species.length && species[selectedIndex]) {
          selectSpecies(species[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSpecies = (sp: FishSpecies) => {
    onChange(sp.common_name);
    onSpeciesSelect(sp);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target as Node) &&
        listRef.current && 
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isOpen && value.length >= 2 && (isLoading || (species && species.length > 0));

  const listboxId = 'species-search-listbox';
  const getOptionId = (index: number) => `species-option-${index}`;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onSpeciesSelect(null); // Clear selected species when typing
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={selectedIndex >= 0 ? getOptionId(selectedIndex) : undefined}
          aria-autocomplete="list"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div 
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Fish species search results"
          className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Searching...
            </div>
          ) : species && species.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {species.map((sp, index) => (
                <button
                  key={sp.id}
                  id={getOptionId(index)}
                  type="button"
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => selectSpecies(sp)}
                  className={cn(
                    "w-full text-left px-3 py-2 flex items-start gap-3 hover:bg-accent transition-colors",
                    selectedIndex === index && "bg-accent"
                  )}
                >
                  <Fish className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sp.common_name}</span>
                      {getTemperamentBadge(sp.temperament)}
                    </div>
                    <div className="text-xs text-muted-foreground italic">
                      {sp.scientific_name}
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{sp.adult_size_inches}" max</span>
                      <span>•</span>
                      <span>{sp.min_tank_gallons}+ gal</span>
                      {sp.schooling && (
                        <>
                          <span>•</span>
                          <span>Schools of {sp.min_school_size}+</span>
                        </>
                      )}
                    </div>
                  </div>
                  {value.toLowerCase() === sp.common_name.toLowerCase() && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No species found matching "{value}"
            </div>
          )}
          
          <div className="px-3 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
            Search our database of 50+ aquarium species
          </div>
        </div>
      )}
    </div>
  );
}
