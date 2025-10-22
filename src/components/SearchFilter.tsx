/**
 * Search Filter Component
 * Allows searching and filtering of hierarchy nodes
 */

import React, { useState, useEffect, useRef } from 'react';
import { SearchResult } from '../types';
import { searchNodes } from '../utils/dataTransform';

interface SearchFilterProps {
  /** All searchable nodes */
  searchableNodes: SearchResult[];
  /** Callback when a search result is selected */
  onSelect: (result: SearchResult) => void;
  /** Callback when search is cleared */
  onClear: () => void;
}

/**
 * Format currency values
 */
function formatValue(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchableNodes,
  onSelect,
  onClear
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        const filtered = searchNodes(searchTerm, searchableNodes);
        setResults(filtered.slice(0, 50)); // Limit to 50 results
        setIsOpen(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchableNodes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setSearchTerm(result.name);
    setIsOpen(false);
    onSelect(result);
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name, BU code, or BEBL code..."
          className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={result.path}
              onClick={() => handleSelect(result)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              } transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{result.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {result.buCode && (
                      <span className="mr-3">
                        <span className="font-medium">BU:</span> {result.buCode}
                      </span>
                    )}
                    {result.beblCode && (
                      <span>
                        <span className="font-medium">BEBL:</span> {result.beblCode}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Level {result.level}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatValue(result.value)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm && results.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-center">
          No results found
        </div>
      )}
    </div>
  );
};

export default SearchFilter;

