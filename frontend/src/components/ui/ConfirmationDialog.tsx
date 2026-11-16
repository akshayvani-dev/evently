import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  loadingLabel = 'Please wait...',
  isLoading = false,
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      aria-busy={isLoading}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onCancel();
      }}
      className="fixed inset-0 m-0 h-dvh w-screen max-w-none border-0 bg-transparent p-0 text-text"
    >
      <div className="flex h-full w-full items-center justify-center bg-black/65 p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <h2 id="confirmation-dialog-title" className="text-lg font-semibold text-text">
            {title}
          </h2>
          <p id="confirmation-dialog-description" className="mt-2 text-sm leading-relaxed text-text-muted">
            {description}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className={isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
              onClick={onCancel}
              autoFocus
            >
              Cancel
            </Button>
            <Button
              variant={isDestructive ? 'outline' : 'gradient'}
              size="sm"
              disabled={isLoading}
              className={`${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                isDestructive
                  ? 'border-[#F0786B]/40 bg-[#F0786B]/10 text-[#F0786B] hover:bg-[#F0786B]/15'
                  : ''
              }`}
              onClick={onConfirm}
            >
              {isLoading ? loadingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmationDialog;
