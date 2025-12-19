import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTrainingSession } from '../utils/api';
import type { Category } from '../types';
import './TrainingSetup.css';

function TrainingSetup() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [duration, setDuration] = useState(30);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    'technique',
    'form',
    'self_defense',
    'basic',
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate estimated entry count
  const estimatedCount = Math.max(4, Math.min(8, Math.floor(duration / 5)));

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated || !token) {
      setError('You must be logged in to create a training session');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    if (duration < 5 || duration > 120) {
      setError('Duration must be between 5 and 120 minutes');
      return;
    }

    setLoading(true);

    try {
      const session = await createTrainingSession(
        {
          duration_minutes: duration,
          categories: selectedCategories,
        },
        token
      );

      // Navigate to active session page
      navigate(`/training/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setLoading(false);
    }
  };

  return (
    <div className="training-setup">
      <div className="setup-card">
        <h2>Start Training Session</h2>

        <form onSubmit={handleSubmit} className="setup-form">
          {/* Duration Input */}
          <div className="form-group">
            <label htmlFor="duration">Session Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              min="5"
              max="120"
              step="5"
              required
              disabled={loading}
              className="duration-input"
            />
            <span className="help-text">Between 5 and 120 minutes</span>
          </div>

          {/* Category Selection */}
          <div className="form-group">
            <label>Categories to Include</label>
            <div className="category-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('technique')}
                  onChange={() => handleCategoryToggle('technique')}
                  disabled={loading}
                />
                <span>Techniques</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('form')}
                  onChange={() => handleCategoryToggle('form')}
                  disabled={loading}
                />
                <span>Forms</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('self_defense')}
                  onChange={() => handleCategoryToggle('self_defense')}
                  disabled={loading}
                />
                <span>Self Defense</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('basic')}
                  onChange={() => handleCategoryToggle('basic')}
                  disabled={loading}
                />
                <span>Basics</span>
              </label>
            </div>
            <span className="help-text">Select at least one category</span>
          </div>

          {/* Preview */}
          <div className="session-preview">
            <h3>Session Preview</h3>
            <div className="preview-details">
              <div className="preview-item">
                <span className="preview-label">Duration:</span>
                <span className="preview-value">{duration} minutes</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Estimated techniques:</span>
                <span className="preview-value">{estimatedCount}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Time per technique:</span>
                <span className="preview-value">
                  ~{Math.floor(duration / estimatedCount)} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="start-button"
            disabled={loading || selectedCategories.length === 0}
          >
            {loading ? 'Creating Session...' : 'Start Training'}
          </button>

          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default TrainingSetup;
