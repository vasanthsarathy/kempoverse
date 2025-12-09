import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EntryForm from '../components/EntryForm';
import { fetchEntry } from '../utils/api';
import type { Entry } from '../types';

export default function EditEntry() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEntry() {
      if (!id) {
        setError('No entry ID provided');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchEntry(id);
        setEntry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    }

    loadEntry();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading entry...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#c33' }}>{error || 'Entry not found'}</p>
      </div>
    );
  }

  return <EntryForm mode="edit" existingEntry={entry} />;
}
