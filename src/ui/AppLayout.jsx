import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4 focus:text-stone-900"
      >
        Skip to content
      </a>
      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <Header onOpen={() => setIsMenuOpen(true)} />
      <main id="main" className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
export default AppLayout;
