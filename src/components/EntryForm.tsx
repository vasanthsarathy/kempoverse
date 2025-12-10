import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createEntry, updateEntry, getAllTags } from '../utils/api';
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

  // Tag autocomplete state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  const { token } = useAuth();
  const navigate = useNavigate();

  // Fetch all existing tags on mount
  useEffect(() => {
    getAllTags()
      .then(tags => setAllTags(tags))
      .catch(err => console.error('Failed to load tags:', err));
  }, []);

  // Update tag suggestions when tagsText changes
  const handleTagsChange = (value: string) => {
    setTagsText(value);

    // Get the current word being typed (after last comma)
    const lastCommaIndex = value.lastIndexOf(',');
    const currentTag = value.slice(lastCommaIndex + 1).trim().toLowerCase();

    if (currentTag.length > 0) {
      // Filter existing tags that match current input
      const matches = allTags.filter(tag =>
        tag.toLowerCase().includes(currentTag) &&
        !value.split(',').map(t => t.trim()).includes(tag)
      );
      setTagSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  // Handle selecting a suggestion
  const selectSuggestion = (tag: string) => {
    const lastCommaIndex = tagsText.lastIndexOf(',');
    const newTagsText = lastCommaIndex >= 0
      ? tagsText.slice(0, lastCommaIndex + 1) + ' ' + tag + ', '
      : tag + ', ';
    setTagsText(newTagsText);
    setShowSuggestions(false);
    setTagSuggestions([]);
    tagsInputRef.current?.focus();
  };

  // Handle keyboard navigation in suggestions
  const handleTagsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < tagSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      selectSuggestion(tagSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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
              <option value="knowledge">Knowledge</option>
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

          <div className="form-group tag-input-wrapper">
            <label htmlFor="tags">Tags *</label>
            <input
              type="text"
              id="tags"
              ref={tagsInputRef}
              value={tagsText}
              onChange={(e) => handleTagsChange(e.target.value)}
              onKeyDown={handleTagsKeyDown}
              onFocus={() => handleTagsChange(tagsText)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g., haymaker, outside-defense, takedown"
              required
              disabled={loading}
              autoComplete="off"
            />
            {showSuggestions && tagSuggestions.length > 0 && (
              <ul className="tag-suggestions">
                {tagSuggestions.map((tag, index) => (
                  <li
                    key={tag}
                    className={index === selectedSuggestionIndex ? 'selected' : ''}
                    onClick={() => selectSuggestion(tag)}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            <span className="help-text">Comma-separated list (at least one required) - start typing for suggestions</span>
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
