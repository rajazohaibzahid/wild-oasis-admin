import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  House,
  Users,
  SlidersHorizontal,
  Trees,
  ArrowUpRight,
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/cabins', label: 'Cabins', icon: House },
  { to: '/guests', label: 'Guests', icon: Users },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-stone-950/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#173e35] px-5 py-8 text-white transition-transform lg:visible lg:translate-x-0 ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        <NavLink to="/dashboard" onClick={onClose} className="mb-12 flex items-center gap-3 px-3">
          <Trees className="text-[#c7d2b5]" size={34} />
          <span>
            <span className="block font-display text-2xl leading-6">Wild Oasis</span>
            <span className="text-[10px] tracking-[0.3em] text-emerald-100/60 uppercase">
              Admin workspace
            </span>
          </span>
        </NavLink>
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-emerald-100/40 uppercase">
          Management
        </p>
        <nav aria-label="Main navigation" className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${isActive ? 'bg-white/12 font-semibold text-white' : 'text-emerald-50/60 hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-3 pt-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-emerald-100/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Wild Oasis Escapes
          </div>
          <p className="text-xs leading-5 text-emerald-100/40">
            A little closer to nature.
            <br />A little further from ordinary.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-[10px] tracking-widest text-emerald-100/50 uppercase">
            Staff workspace <ArrowUpRight size={12} />
          </span>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
