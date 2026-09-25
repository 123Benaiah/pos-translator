import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface DeleteConfirmProps {
  open: boolean;
  entryKey: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirm({
  open,
  entryKey,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete Entry">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete the entry for{' '}
          <span className="font-semibold text-purple-900">"{entryKey}"</span>? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
