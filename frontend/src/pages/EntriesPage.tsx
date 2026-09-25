import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import EntryForm from '../components/entries/EntryForm';
import EntryFilters from '../components/entries/EntryFilters';
import EntriesTable from '../components/entries/EntriesTable';
import DeleteConfirm from '../components/entries/DeleteConfirm';
import { useEntries, useDeleteEntry, useUpdateEntry } from '../hooks/useEntries';
import type { Entry } from '../types';

export default function EntriesPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [verified, setVerified] = useState('');
  const [missing, setMissing] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const { data, isLoading } = useEntries({
    page,
    perPage: 50,
    category: category || undefined,
    verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
    missing: missing || undefined,
  });

  const filteredEntries = data?.entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.en.toLowerCase().includes(q) ||
      entry.loz.toLowerCase().includes(q) ||
      entry.bem.toLowerCase().includes(q)
    );
  });

  const deleteMutation = useDeleteEntry();
  const updateMutation = useUpdateEntry();

  const handleDelete = () => {
    if (!deleteKey) return;
    deleteMutation.mutate(deleteKey, {
      onSuccess: () => {
        toast.success('Entry deleted');
        setDeleteKey(null);
      },
      onError: () => toast.error('Failed to delete entry'),
    });
  };

  const handleToggleVerify = (key: string, current: boolean) => {
    updateMutation.mutate(
      { key, body: { verified: !current } },
      {
        onSuccess: () => toast.success(current ? 'Entry unverified' : 'Entry verified'),
        onError: () => toast.error('Failed to update verification'),
      },
    );
  };

  return (
    <div>
      <Header
        title="Entries"
        subtitle="Manage translation entries"
        actions={
          <Button
            variant="accent"
            onClick={() => {
              setEditEntry(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        }
      />

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search entries by English, Lozi, or Bemba..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 text-base"
          />
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-400" />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
        <EntryFilters
          category={category}
          verified={verified}
          missing={missing}
          onCategoryChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
          onVerifiedChange={(v) => {
            setVerified(v);
            setPage(1);
          }}
          onMissingChange={(v) => {
            setMissing(v);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredEntries && filteredEntries.length > 0 ? (
        <div className="space-y-4">
          <EntriesTable
            entries={filteredEntries}
            onEdit={(entry) => {
              setEditEntry(entry);
              setShowForm(true);
            }}
            onDelete={(key) => setDeleteKey(key)}
            onToggleVerify={handleToggleVerify}
          />

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-white px-5 py-3 shadow-sm">
              <span className="text-sm text-slate-500">
                Page {data.page} of {data.pages} ({data.total} entries)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= (data?.pages ?? 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No Entries Found"
          description="Try adjusting your filters or add a new entry"
          action={
            <Button
              variant="accent"
              onClick={() => {
                setEditEntry(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          }
        />
      )}

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditEntry(null);
        }}
        title={editEntry ? 'Edit Entry' : 'New Entry'}
      >
        <EntryForm
          entry={editEntry}
          onClose={() => {
            setShowForm(false);
            setEditEntry(null);
          }}
        />
      </Modal>

      <DeleteConfirm
        open={!!deleteKey}
        entryKey={deleteKey ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteKey(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
