import { useEffect, useState } from 'react';
import { fetchEntries } from '../utils/api';
import EntryList from '../components/EntryList';
import type { Entry } from '../types';
import './Home.css';

function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <h2>All Entries</h2>
        <p className="entry-count">{entries.length} total entries</p>
      </div>
      <EntryList entries={entries} />
    </div>
  );
}

export default Home;
