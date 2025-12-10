import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchEntries, getAllTags, type FetchEntriesParams } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import EntryList from '../components/EntryList';
import type { Entry } from '../types';
import './Home.css';

function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Filter states
  const [searchInput, setSearchInput] = useState(''); // User's input
  const [searchQuery, setSearchQuery] = useState(''); // Debounced search query
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState('');
  const [beltFilter, setBeltFilter] = useState('');

  // Tag autocomplete state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedTagIndex, setSelectedTagIndex] = useState(-1);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Fetch all tags on mount
  useEffect(() => {
    getAllTags()
      .then(tags => setAllTags(tags))
      .catch(err => console.error('Failed to load tags:', err));
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: FetchEntriesParams = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (tagFilter) params.tag = tagFilter;
      if (beltFilter) params.belt = beltFilter;

      const data = await fetchEntries(params);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, tagFilter, beltFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setCategoryFilter('');
    setTagFilter('');
    setBeltFilter('');
    setShowTagSuggestions(false);
  };

  // Handle tag filter input changes
  const handleTagFilterChange = (value: string) => {
    setTagFilter(value);

    if (value.length > 0) {
      const matches = allTags.filter(tag =>
        tag.toLowerCase().includes(value.toLowerCase())
      );
      console.log('Matches found:', matches);
      console.log('Setting showTagSuggestions to:', matches.length > 0);
      setTagSuggestions(matches);
      setShowTagSuggestions(matches.length > 0);
      setSelectedTagIndex(-1);
    } else {
      setShowTagSuggestions(false);
      setTagSuggestions([]);
    }
  };

  // Handle selecting a tag suggestion
  const selectTagSuggestion = (tag: string) => {
    setTagFilter(tag);
    setShowTagSuggestions(false);
    setTagSuggestions([]);
    tagInputRef.current?.focus();
  };

  // Handle keyboard navigation in tag suggestions
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showTagSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedTagIndex(prev =>
        prev < tagSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedTagIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedTagIndex >= 0) {
      e.preventDefault();
      selectTagSuggestion(tagSuggestions[selectedTagIndex]);
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const hasActiveFilters = searchInput || categoryFilter || tagFilter || beltFilter;

  return (
    <div className="home">
      <div className="home-header">
        <div className="home-header-content">
          <h2>All Entries</h2>
          <p className="entry-count">{entries.length} {hasActiveFilters ? 'filtered' : 'total'} entries</p>
        </div>
        {isAuthenticated && (
          <Link to="/entries/new" className="new-entry-button">
            + New Entry
          </Link>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="technique">Technique</option>
            <option value="form">Form</option>
            <option value="self_defense">Self Defense</option>
            <option value="knowledge">Knowledge</option>
            <option value="basic">Basic</option>
          </select>

          <div className="tag-filter-wrapper">
            <input
              type="text"
              ref={tagInputRef}
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => handleTagFilterChange(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onFocus={() => handleTagFilterChange(tagFilter)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              className="filter-input"
              autoComplete="off"
            />
            {(() => {
              console.log('Rendering dropdown check:', { showTagSuggestions, suggestionsLength: tagSuggestions.length });
              return showTagSuggestions && tagSuggestions.length > 0 && (
                <ul className="tag-suggestions">
                  {tagSuggestions.map((tag, index) => (
                    <li
                      key={tag}
                      className={index === selectedTagIndex ? 'selected' : ''}
                      onClick={() => selectTagSuggestion(tag)}
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          <input
            type="text"
            placeholder="Filter by belt..."
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="filter-input"
          />

          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading && !entries.length ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading entries...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadEntries} className="retry-button">
            Retry
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="no-results">
          <p>No entries found{hasActiveFilters ? ' matching your filters' : ''}.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <EntryList entries={entries} />
      )}
    </div>
  );
}

export default Home;
