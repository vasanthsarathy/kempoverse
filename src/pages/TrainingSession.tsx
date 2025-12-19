import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchTrainingSession, updateTrainingSession } from '../utils/api';
import type { TrainingSession as TrainingSessionType } from '../types';
import './TrainingSession.css';

function TrainingSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [session, setSession] = useState<TrainingSessionType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session on mount
  useEffect(() => {
    if (!id) return;

    fetchTrainingSession(id)
      .then((data) => {
        setSession(data);
        if (data.items && data.items.length > 0) {
          setSecondsRemaining(data.items[0].time_allocated_seconds);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Timer logic (timestamp-based for accuracy)
  useEffect(() => {
    if (!session || isPaused || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Auto-advance to next item
          if (currentIndex < (session.items?.length || 0) - 1) {
            handleNext();
          } else {
            // Session complete
            handleComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isPaused, secondsRemaining, currentIndex]);

  const currentItem = session?.items?.[currentIndex];

  const handleNext = () => {
    if (!session?.items) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex < session.items.length) {
      setCurrentIndex(nextIndex);
      setSecondsRemaining(session.items[nextIndex].time_allocated_seconds);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (!session?.items || currentIndex === 0) return;

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setSecondsRemaining(session.items[prevIndex].time_allocated_seconds);
  };

  const handleComplete = async () => {
    if (!session || !token) return;

    try {
      await updateTrainingSession(
        session.id,
        {
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
        token
      );
      navigate(`/training/sessions/${session.id}`);
    } catch (err) {
      console.error('Failed to mark session as complete:', err);
      navigate(`/training/sessions/${session.id}`);
    }
  };

  const handleEndEarly = async () => {
    if (!session || !token) return;

    const confirmed = window.confirm(
      'Are you sure you want to end this training session early?'
    );

    if (!confirmed) return;

    try {
      await updateTrainingSession(
        session.id,
        {
          status: 'abandoned',
          completed_at: new Date().toISOString(),
        },
        token
      );
      navigate(`/training/sessions/${session.id}`);
    } catch (err) {
      console.error('Failed to end session:', err);
      navigate('/training/history');
    }
  };

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="training-session loading">
        <div className="loading-spinner"></div>
        <p>Loading training session...</p>
      </div>
    );
  }

  if (error || !session || !session.items || session.items.length === 0) {
    return (
      <div className="training-session error">
        <p className="error-message">{error || 'Session not found'}</p>
        <Link to="/training/history" className="back-button">
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="training-session active">
      {/* Progress Bar */}
      <div className="progress-bar">
        <span className="progress-text">
          {currentIndex + 1} of {session.items.length}
        </span>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${((currentIndex + 1) / session.items.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Timer Display */}
      <div className="timer-display">
        <div className="timer-value">{formatTime(secondsRemaining)}</div>
        <button
          className="pause-button"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Current Technique Card */}
      {currentItem && (
        <div className="technique-card">
          <div className="technique-header">
            <Link to={`/entry/${currentItem.entry_id}`} className="technique-title">
              {currentItem.entry_title}
            </Link>
            <span className={`category-badge category-${currentItem.entry_category}`}>
              {currentItem.entry_category.replace('_', ' ')}
            </span>
          </div>

          {currentItem.variation_text && (
            <div className="variation-instruction">
              <span className="variation-label">Variation:</span>
              <span className="variation-text">{currentItem.variation_text}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="session-controls">
        <button
          className="nav-button prev"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        <button className="nav-button next" onClick={handleNext}>
          {currentIndex < session.items.length - 1 ? 'Next →' : 'Finish'}
        </button>
      </div>

      {/* End Session Button */}
      <button className="end-session-button" onClick={handleEndEarly}>
        End Session Early
      </button>
    </div>
  );
}

export default TrainingSession;
