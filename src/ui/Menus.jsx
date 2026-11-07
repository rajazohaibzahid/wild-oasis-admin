import { useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
function Menus({ label, children }) {
  const menu = useRef(null);
  return (
    <details
      ref={menu}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          menu.current.open = false;
          menu.current.querySelector('summary').focus();
        }
      }}
    >
      <summary
        aria-label={label}
        className="inline-flex list-none rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
      >
        <MoreHorizontal size={20} />
      </summary>
      <div
        className="absolute right-0 z-20 min-w-40 rounded-lg border border-stone-200 bg-white p-2 shadow-lg dark:border-stone-700 dark:bg-stone-900"
        onClick={() => {
          menu.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
export default Menus;
