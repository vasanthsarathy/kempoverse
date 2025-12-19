import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrainingSessions } from '../utils/api';
import type { TrainingSession } from '../types';
import './TrainingHistory.css';

function TrainingHistory() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainingSessions()
      .then((data) => {
        setSessions(data.sessions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="training-history loading">
        <div className="loading-spinner"></div>
        <p>Loading training history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-history error">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="training-history">
      <div className="history-header">
        <h2>Training History</h2>
        <Link to="/training/setup" className="new-session-button">
          + New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No training sessions yet</p>
          <Link to="/training/setup" className="start-button">
            Start Your First Training Session
          </Link>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/training/sessions/${session.id}`}
              className="session-card"
            >
              <div className="session-header">
                <span className="session-date">{formatDate(session.started_at)}</span>
                <span className={`status-badge status-${session.status}`}>
                  {session.status}
                </span>
              </div>

              <div className="session-details">
                <div className="detail-item">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{session.duration_minutes} min</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Techniques:</span>
                  <span className="detail-value">{session.entry_count}</span>
                </div>
              </div>

              <div className="session-categories">
                {session.categories.map((cat) => (
                  <span key={cat} className={`category-tag category-${cat}`}>
                    {cat.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrainingHistory;
