import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useCreateEntry, useUpdateEntry } from '../../hooks/useEntries';
import type { Entry, EntryCreate, EntryUpdate, Language } from '../../types';
import type { AxiosError } from 'axios';

interface BackendError {
  detail?: string;
  error?: string;
}

function getErrorMessage(err: unknown): string {
  const axErr = err as AxiosError<BackendError>;
  return axErr.response?.data?.detail ?? axErr.response?.data?.error ?? axErr.message ?? 'Unknown error';
}

interface EntryFormProps {
  entry?: Entry | null;
  onClose: () => void;
}

const LANG_FIELDS: { key: Language; label: string; color: string }[] = [
  { key: 'en', label: 'English', color: 'purple' },
  { key: 'loz', label: 'Lozi', color: 'orange' },
  { key: 'bem', label: 'Bemba', color: 'gold' },
];

export default function EntryForm({ entry, onClose }: EntryFormProps) {
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const [en, setEn] = useState(entry?.en ?? '');
  const [loz, setLoz] = useState(entry?.loz ?? '');
  const [bem, setBem] = useState(entry?.bem ?? '');
  const [category, setCategory] = useState(entry?.category ?? 'custom');

  useEffect(() => {
    if (entry) {
      setEn(entry.en);
      setLoz(entry.loz);
      setBem(entry.bem);
      setCategory(entry.category ?? 'custom');
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!en.trim()) {
      toast.error('English text is required');
      return;
    }

    if (entry) {
      const body: EntryUpdate = {};
      if (loz !== entry.loz) body.loz = loz;
      if (bem !== entry.bem) body.bem = bem;
      if (category !== entry.category) body.category = category;

      updateMutation.mutate(
        { key: entry.key, body },
        {
          onSuccess: () => {
            toast.success('Entry updated');
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        },
      );
    } else {
      const body: EntryCreate = { en: en.trim(), loz, bem, category };
      createMutation.mutate(body, {
        onSuccess: () => {
          toast.success('Entry created');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {LANG_FIELDS.map((field) => (
        <Input
          key={field.key}
          label={field.label}
          value={field.key === 'en' ? en : field.key === 'loz' ? loz : bem}
          onChange={(e) => {
            if (field.key === 'en') setEn(e.target.value);
            else if (field.key === 'loz') setLoz(e.target.value);
            else setBem(e.target.value);
          }}
          disabled={field.key === 'en' && !!entry}
          placeholder={`Enter ${field.label} translation`}
        />
      ))}

      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={[
          { value: 'custom', label: 'Custom' },
          { value: 'animals', label: 'Animals' },
          { value: 'body', label: 'Body' },
          { value: 'business', label: 'Business' },
          { value: 'food', label: 'Food' },
          { value: 'greeting', label: 'Greeting' },
          { value: 'nature', label: 'Nature' },
          { value: 'number', label: 'Number' },
          { value: 'people', label: 'People' },
          { value: 'place', label: 'Place' },
          { value: 'time', label: 'Time' },
          { value: 'action', label: 'Action' },
          { value: 'adjective', label: 'Adjective' },
          { value: 'family', label: 'Family' },
          { value: 'building', label: 'Building' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="accent" loading={isPending}>
          {entry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
}
