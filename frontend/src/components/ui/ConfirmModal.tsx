import Modal from "./Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  loading = false,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      }
    >
      {description && (
        <p className="text-sm text-slate-600">{description}</p>
      )}
    </Modal>
  );
}
