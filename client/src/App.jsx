import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';

// The application exposes only the five IPL management modules.
const Teams     = lazy(() => import('./pages/Teams'));
const Players   = lazy(() => import('./pages/Players'));
const Matches   = lazy(() => import('./pages/Matches'));
const PlayerStatistics = lazy(() => import('./pages/PlayerStatistics'));
const TeamStatistics = lazy(() => import('./pages/TeamStatistics'));

/**
 * Fallback shown while lazy-loaded page chunks are being fetched.
 */
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1rem',
  }}>
    <LoadingSpinner />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading page…</p>
  </div>
);

const App = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* All authenticated / in-app routes share the MainLayout (sidebar + navbar) */}
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/teams" replace />} />
          <Route path="teams"     element={<Teams />} />
          <Route path="players"   element={<Players />} />
          <Route path="matches"   element={<Matches />} />
          <Route path="player-statistics" element={<PlayerStatistics />} />
          <Route path="team-statistics" element={<TeamStatistics />} />

          <Route path="*" element={<Navigate to="/teams" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
