import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchEntries, type FetchEntriesParams } from '../utils/api';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState('');
  const [beltFilter, setBeltFilter] = useState('');

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

  if (loading) {
    return (
      <div className="home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTagFilter('');
    setBeltFilter('');
  };

  const hasActiveFilters = searchQuery || categoryFilter || tagFilter || beltFilter;

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <option value="history">History</option>
            <option value="basic">Basic</option>
          </select>

          <input
            type="text"
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="filter-input"
          />

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

      <EntryList entries={entries} />
    </div>
  );
}

export default Home;
