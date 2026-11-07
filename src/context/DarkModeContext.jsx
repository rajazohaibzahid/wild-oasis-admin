import { createContext, useContext, useEffect, useState } from 'react';
const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('wild-oasis-admin-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(
    function syncTheme() {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('wild-oasis-admin-theme', isDarkMode ? 'dark' : 'light');
    },
    [isDarkMode],
  );
  function toggleDarkMode() {
    setIsDarkMode((current) => !current);
  }
  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
