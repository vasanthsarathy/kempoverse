import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { fetchEntry, deleteEntry } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { Entry } from '../types';
import './EntryDetail.css';

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

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

  // Extract YouTube video ID
  const youtubeVideoId = useMemo(() => {
    if (!entry?.video_url) return null;
    return getYouTubeVideoId(entry.video_url);
  }, [entry?.video_url]);

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

        {youtubeVideoId && (
          <div className="video-container">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {entry.image_urls && entry.image_urls.length > 0 && (
          <section className="image-gallery">
            <div className="gallery-grid">
              {entry.image_urls.map((url, index) => (
                <div key={url} className="gallery-item">
                  <img
                    src={url}
                    alt={`${entry.title} - Image ${index + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

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
