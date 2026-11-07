import { Link } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, UserRound } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useUser } from '../features/authentication/useUser';
import { useLogout } from '../features/authentication/useLogout';
import { getToday, formatDate } from '../utils/helpers';
import Button from './Button';

function Header({ onOpen }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user } = useUser();
  const { logout, isLoggingOut } = useLogout();
  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-900 md:px-8">
      <div className="flex items-center gap-3">
        <button aria-label="Open navigation" className="rounded-lg p-2 lg:hidden" onClick={onOpen}>
          <Menu size={22} />
        </button>
        <p className="hidden text-sm text-stone-500 sm:block">
          {formatDate(getToday())}
          <span className="ml-3 text-stone-300">/</span>
          <span className="ml-3 text-xs">Asia/Karachi</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/account" className="mr-2 flex items-center gap-3 rounded-lg px-2 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <UserRound size={18} />
          </span>
          <span className="hidden max-w-40 truncate text-sm font-medium sm:block">
            {user?.user_metadata?.full_name || 'Staff account'}
          </span>
        </Link>
        <Button
          variant="ghost"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleDarkMode}
          className="px-2.5"
        >
          {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </Button>
        <Button
          variant="ghost"
          aria-label="Sign out"
          onClick={logout}
          disabled={isLoggingOut}
          className="px-2.5"
        >
          <LogOut size={19} />
        </Button>
      </div>
    </header>
  );
}
export default Header;
