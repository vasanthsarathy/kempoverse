import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { fetchEntry, deleteEntry } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { Entry } from '../types';
import './EntryDetail.css';

function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  // Parse markdown content
  const parsedContent = useMemo(() => {
    if (!entry) return '';
    return marked.parse(entry.content_md);
  }, [entry]);

  const handleDelete = async () => {
    if (!id || !token) return;

    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteEntry(id, token);
      navigate('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete entry');
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError('No entry ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchEntry(id)
      .then((data) => {
        setEntry(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load entry');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="entry-detail">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-detail">
        <div className="error-state">
          <p>{error}</p>
          <Link to="/" className="back-link">
            ← Back to entries
          </Link>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="entry-detail">
        <div className="error-state">
          <p>Entry not found</p>
          <Link to="/" className="back-link">
            ← Back to entries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-detail">
      <div className="entry-actions">
        <Link to="/" className="back-link">
          ← Back to entries
        </Link>
        {isAuthenticated && (
          <div className="admin-actions">
            <Link to={`/entries/${id}/edit`} className="edit-button">
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="delete-button"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <article className="entry-content">
        <header className="entry-detail-header">
          <div className="title-row">
            <h1>{entry.title}</h1>
            <span className={`category-badge category-${entry.category}`}>
              {entry.category.replace('_', ' ')}
            </span>
          </div>

          {entry.subcategory && (
            <p className="subcategory">{entry.subcategory}</p>
          )}

          {entry.belts && entry.belts.length > 0 && (
            <div className="belt-list">
              <strong>Belts:</strong>
              {entry.belts.map((belt, index) => (
                <span key={index} className="belt-tag">
                  {belt}
                </span>
              ))}
            </div>
          )}

          {entry.tags.length > 0 && (
            <div className="tag-list">
              {entry.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{
            __html: parsedContent,
          }}
        />

        {entry.references.length > 0 && (
          <section className="references">
            <h2>References</h2>
            <ul>
              {entry.references.map((ref, index) => (
                <li key={index}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reference-link"
                  >
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="entry-meta">
          <p className="meta-text">
            Created: {new Date(entry.created_at).toLocaleDateString()}
          </p>
          <p className="meta-text">
            Updated: {new Date(entry.updated_at).toLocaleDateString()}
          </p>
        </footer>
      </article>
    </div>
  );
}

export default EntryDetail;
