import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEntries } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import EntryList from '../components/EntryList';
import type { Entry } from '../types';
import './Home.css';

function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchEntries()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load entries');
        setLoading(false);
      });
  }, []);

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

  return (
    <div className="home">
      <div className="home-header">
        <div className="home-header-content">
          <h2>All Entries</h2>
          <p className="entry-count">{entries.length} total entries</p>
        </div>
        {isAuthenticated && (
          <Link to="/entries/new" className="new-entry-button">
            + New Entry
          </Link>
        )}
      </div>
      <EntryList entries={entries} />
    </div>
  );
}

export default Home;
