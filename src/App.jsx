import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DarkModeProvider } from './context/DarkModeContext';
import { useAuthSession } from './hooks/useAuthSession';
import ProtectedRoute from './ui/ProtectedRoute';
import AppLayout from './ui/AppLayout';
import ErrorBoundary from './ui/ErrorBoundary';
import Spinner from './ui/Spinner';
import Cabins from './pages/Cabins';
import Bookings from './pages/Bookings';
import Booking from './pages/Booking';
import Checkin from './pages/Checkin';
import Guests from './pages/Guests';
import Guest from './pages/Guest';
import Settings from './pages/Settings';
import Account from './pages/Account';
import Login from './pages/Login';
import PageNotFound from './pages/PageNotFound';

const Dashboard = lazy(() => import('./pages/Dashboard'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function AppRoutes() {
  useAuthSession();
  return (
    <>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<Spinner />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route path="cabins" element={<Cabins />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:bookingId" element={<Booking />} />
          <Route path="checkin/:bookingId" element={<Checkin />} />
          <Route path="guests" element={<Guests />} />
          <Route path="guests/:guestId" element={<Guest />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}
export default App;
