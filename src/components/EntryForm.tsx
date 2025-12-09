import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createEntry, updateEntry } from '../utils/api';
import type { Entry, Category } from '../types';
import './EntryForm.css';

interface EntryFormProps {
  existingEntry?: Entry;
  mode: 'create' | 'edit';
}

export default function EntryForm({ existingEntry, mode }: EntryFormProps) {
  const [title, setTitle] = useState(existingEntry?.title || '');
  const [category, setCategory] = useState<Category>(existingEntry?.category || 'technique');
  const [subcategory, setSubcategory] = useState(existingEntry?.subcategory || '');
  const [beltsText, setBeltsText] = useState(existingEntry?.belts?.join(', ') || '');
  const [tagsText, setTagsText] = useState(existingEntry?.tags.join(', ') || '');
  const [content, setContent] = useState(existingEntry?.content_md || '');
  const [referencesText, setReferencesText] = useState(existingEntry?.references.join('\n') || '');
  const [videoUrl, setVideoUrl] = useState(existingEntry?.video_url || '');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Parse arrays from text inputs
      const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
      const belts = beltsText ? beltsText.split(',').map(b => b.trim()).filter(Boolean) : undefined;
      const references = referencesText ? referencesText.split('\n').map(r => r.trim()).filter(Boolean) : [];

      if (!tags.length) {
        throw new Error('At least one tag is required');
      }

      const entryData = {
        title,
        category,
        subcategory: subcategory || undefined,
        belts,
        tags,
        content_md: content,
        references,
        video_url: videoUrl || undefined,
      };

      if (mode === 'create') {
        const newEntry = await createEntry(entryData, token);
        navigate(`/entry/${newEntry.id}`);
      } else if (existingEntry) {
        const updated = await updateEntry(existingEntry.id, entryData, token);
        navigate(`/entry/${updated.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entry-form-container">
      <div className="entry-form-card">
        <h2>{mode === 'create' ? 'Create New Entry' : 'Edit Entry'}</h2>

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Kempo 6: Leg Hawk"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              required
              disabled={loading}
            >
              <option value="technique">Technique</option>
              <option value="form">Form</option>
              <option value="self_defense">Self Defense</option>
              <option value="history">History</option>
              <option value="basic">Basic</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subcategory">Subcategory</label>
            <input
              type="text"
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g., Kempos, Animals, Grabs"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="belts">Belt Ranks</label>
            <input
              type="text"
              id="belts"
              value={beltsText}
              onChange={(e) => setBeltsText(e.target.value)}
              placeholder="e.g., Green, Brown 3rd (comma-separated)"
              disabled={loading}
            />
            <span className="help-text">Comma-separated list</span>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags *</label>
            <input
              type="text"
              id="tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="e.g., haymaker, outside-defense, takedown"
              required
              disabled={loading}
            />
            <span className="help-text">Comma-separated list (at least one required)</span>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content (Markdown) *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content in Markdown format..."
              rows={12}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="references">Reference URLs</label>
            <textarea
              id="references"
              value={referencesText}
              onChange={(e) => setReferencesText(e.target.value)}
              placeholder="One URL per line"
              rows={3}
              disabled={loading}
            />
            <span className="help-text">One URL per line</span>
          </div>

          <div className="form-group">
            <label htmlFor="video_url">Video URL (YouTube)</label>
            <input
              type="url"
              id="video_url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={loading}
            />
            <span className="help-text">Paste a YouTube URL to embed video</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Update Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
