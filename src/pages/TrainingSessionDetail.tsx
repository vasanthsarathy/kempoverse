import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchTrainingSession, createTrainingSession } from '../utils/api';
import type { TrainingSession } from '../types';
import './TrainingSessionDetail.css';

function TrainingSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingAgain, setTrainingAgain] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetchTrainingSession(id)
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleTrainAgain = async () => {
    if (!session || !isAuthenticated || !token) return;

    setTrainingAgain(true);

    try {
      const newSession = await createTrainingSession(
        {
          duration_minutes: session.duration_minutes,
          categories: session.categories,
        },
        token
      );

      navigate(`/training/session/${newSession.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new session');
      setTrainingAgain(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="session-detail loading">
        <div className="loading-spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="session-detail error">
        <p className="error-message">{error || 'Session not found'}</p>
        <Link to="/training/history" className="back-button">
          Back to History
        </Link>
      </div>
    );
  }

  const isCompleted = session.status === 'completed';

  return (
    <div className="session-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-content">
          <h2>Training Session</h2>
          <span className={`status-badge status-${session.status}`}>
            {session.status}
          </span>
        </div>
        <Link to="/training/history" className="back-link">
          ← Back to History
        </Link>
      </div>

      {/* Session Info Card */}
      <div className="info-card">
        <div className="info-row">
          <span className="info-label">Date:</span>
          <span className="info-value">{formatDate(session.started_at)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Total Duration:</span>
          <span className="info-value">{session.duration_minutes} minutes</span>
        </div>
        <div className="info-row">
          <span className="info-label">Techniques Practiced:</span>
          <span className="info-value">{session.entry_count}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Categories:</span>
          <div className="categories-list">
            {session.categories.map((cat) => (
              <span key={cat} className={`category-tag category-${cat}`}>
                {cat.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="completion-message">
          <h3>Well done!</h3>
          <p>You completed this training session.</p>
        </div>
      )}

      {!isCompleted && (
        <div className="abandoned-message">
          <p>This session was ended early.</p>
        </div>
      )}

      {/* Items List */}
      <div className="items-section">
        <h3>Techniques</h3>
        <div className="items-list">
          {session.items?.map((item, index) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className="item-number">{index + 1}</span>
                <Link to={`/entry/${item.entry_id}`} className="item-title">
                  {item.entry_title}
                </Link>
                <span className={`category-badge category-${item.entry_category}`}>
                  {item.entry_category.replace('_', ' ')}
                </span>
              </div>

              <div className="item-details">
                <span className="item-time">
                  {formatDuration(item.time_allocated_seconds)}
                </span>
                {item.variation_text && (
                  <span className="item-variation">{item.variation_text}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="detail-actions">
        {isAuthenticated && (
          <button
            className="train-again-button"
            onClick={handleTrainAgain}
            disabled={trainingAgain}
          >
            {trainingAgain ? 'Creating Session...' : 'Train Again (Same Setup)'}
          </button>
        )}
        <Link to="/training/setup" className="new-session-button">
          New Training Session
        </Link>
      </div>
    </div>
  );
}

export default TrainingSessionDetail;
