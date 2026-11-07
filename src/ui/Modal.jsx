import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

function Modal({ title, children, onClose, busy = false }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(function openDialog() {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      previous?.focus();
    };
  }, []);
  function handleCancel(event) {
    event.preventDefault();
    if (!busy) onClose();
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className="fixed m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-stone-800 shadow-2xl backdrop:bg-stone-950/50 dark:bg-stone-900 dark:text-stone-100 sm:p-8"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="font-display text-3xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default Modal;
