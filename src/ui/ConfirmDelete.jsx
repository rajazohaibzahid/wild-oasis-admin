import Button from './Button';
function ConfirmDelete({
  resourceName,
  description,
  onConfirm,
  onClose,
  disabled,
  confirmLabel = 'Delete',
}) {
  return (
    <div>
      <p className="mb-6 text-sm leading-6 text-stone-600 dark:text-stone-300">
        {description ||
          `Delete ${resourceName}? This cannot be undone. Referenced cabin images will be preserved.`}
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={disabled}>
          Go back
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={disabled}>
          {disabled ? 'Saving…' : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
export default ConfirmDelete;
