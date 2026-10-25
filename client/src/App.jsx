import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-load all page components for better code-splitting performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Teams     = lazy(() => import('./pages/Teams'));
const Players   = lazy(() => import('./pages/Players'));
const Matches   = lazy(() => import('./pages/Matches'));
const Seasons   = lazy(() => import('./pages/Seasons'));
const Venues    = lazy(() => import('./pages/Venues'));
const Umpires   = lazy(() => import('./pages/Umpires'));
const Sponsors  = lazy(() => import('./pages/Sponsors'));
const Awards    = lazy(() => import('./pages/Awards'));
const Innings   = lazy(() => import('./pages/Innings'));
const Owners    = lazy(() => import('./pages/Owners'));
const Reports   = lazy(() => import('./pages/Reports'));

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
          <Route index            element={<Dashboard />} />
          <Route path="teams"     element={<Teams />} />
          <Route path="players"   element={<Players />} />
          <Route path="matches"   element={<Matches />} />
          <Route path="seasons"   element={<Seasons />} />
          <Route path="venues"    element={<Venues />} />
          <Route path="umpires"   element={<Umpires />} />
          <Route path="sponsors"  element={<Sponsors />} />
          <Route path="awards"    element={<Awards />} />
          <Route path="innings"   element={<Innings />} />
          <Route path="owners"    element={<Owners />} />
          <Route path="reports"   element={<Reports />} />

          {/* Catch-all: redirect any unknown sub-path back to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
