import { Link } from 'react-router-dom';
import type { Entry } from '../types';
import './EntryList.css';

interface EntryListProps {
  entries: Entry[];
}

function EntryList({ entries }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>No entries found</p>
      </div>
    );
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          to={`/entry/${entry.id}`}
          className="entry-card"
        >
          <div className="entry-header">
            <h3 className="entry-title">{entry.title}</h3>
            <span className={`category-badge category-${entry.category}`}>
              {entry.category.replace('_', ' ')}
            </span>
          </div>

          {entry.subcategory && (
            <p className="entry-subcategory">{entry.subcategory}</p>
          )}

          {entry.belts && entry.belts.length > 0 && (
            <div className="entry-belts">
              {entry.belts.map((belt, index) => (
                <span key={index} className="belt-tag">
                  {belt}
                </span>
              ))}
            </div>
          )}

          <div className="entry-tags">
            {entry.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="tag-more">+{entry.tags.length - 3}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default EntryList;
