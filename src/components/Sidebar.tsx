import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEntries } from '../utils/api';
import type { Entry, Category } from '../types';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryTree {
  [category: string]: {
    [subcategory: string]: Entry[];
  };
}

const CATEGORY_LABELS: Record<Category, string> = {
  technique: 'Techniques',
  form: 'Forms',
  self_defense: 'Self Defense',
  knowledge: 'Knowledge',
  basic: 'Basics',
};

// Define category display order
const CATEGORY_ORDER: Category[] = ['basic', 'technique', 'form', 'self_defense', 'knowledge'];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await fetchEntries({});
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Organize entries into category → subcategory → entries tree
  const categoryTree: CategoryTree = entries.reduce((tree, entry) => {
    const category = entry.category;
    const subcategory = entry.subcategory || 'Other';

    if (!tree[category]) {
      tree[category] = {};
    }
    if (!tree[category][subcategory]) {
      tree[category][subcategory] = [];
    }
    tree[category][subcategory].push(entry);

    return tree;
  }, {} as CategoryTree);

  // Sort entries within each subcategory alphabetically by title
  Object.values(categoryTree).forEach(subcategories => {
    Object.keys(subcategories).forEach(subcategory => {
      subcategories[subcategory].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      );
    });
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (key: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubcategories(newExpanded);
  };

  const handleEntryClick = () => {
    // Close sidebar on mobile when entry is clicked
    onClose();
  };

  if (loading) {
    return (
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Browse</h2>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ×
          </button>
        </div>
        <div className="sidebar-content">
          <p className="sidebar-loading">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <h2>Browse</h2>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ×
        </button>
      </div>

      <div className="sidebar-content">
        {Object.keys(categoryTree).length === 0 ? (
          <p className="sidebar-empty">No entries found</p>
        ) : (
          CATEGORY_ORDER.filter(cat => categoryTree[cat])
            .map(category => {
            const subcategories = categoryTree[category];
            const isExpanded = expandedCategories.has(category);
            const categoryLabel = CATEGORY_LABELS[category as Category] || category;
            const totalEntries = Object.values(subcategories).reduce(
              (sum, entries) => sum + entries.length,
              0
            );

            return (
              <div key={category} className="sidebar-category">
                <button
                  className={`category-button category-${category}`}
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isExpanded}
                >
                  <span className="category-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span className="category-label">{categoryLabel}</span>
                  <span className="category-count">{totalEntries}</span>
                </button>

                {isExpanded && (
                  <div className="subcategory-list">
                    {Object.entries(subcategories)
                      .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                      .map(([subcategory, subcatEntries]) => {
                      const subKey = `${category}-${subcategory}`;
                      const isSubExpanded = expandedSubcategories.has(subKey);

                      return (
                        <div key={subKey} className="sidebar-subcategory">
                          <button
                            className="subcategory-button"
                            onClick={() => toggleSubcategory(subKey)}
                            aria-expanded={isSubExpanded}
                          >
                            <span className="subcategory-icon">
                              {isSubExpanded ? '−' : '+'}
                            </span>
                            <span className="subcategory-label">{subcategory}</span>
                            <span className="subcategory-count">{subcatEntries.length}</span>
                          </button>

                          {isSubExpanded && (
                            <div className="entry-list-sidebar">
                              {subcatEntries.map((entry) => (
                                <Link
                                  key={entry.id}
                                  to={`/entry/${entry.id}`}
                                  className="entry-link"
                                  onClick={handleEntryClick}
                                >
                                  {entry.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Training Section */}
        <div className="sidebar-section training-section">
          <h3 className="section-title">Training</h3>
          <div className="section-links">
            <Link to="/training/setup" className="section-link" onClick={onClose}>
              Start Training Session
            </Link>
            <Link to="/training/history" className="section-link" onClick={onClose}>
              Training History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
