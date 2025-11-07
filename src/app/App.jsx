/**
 * App layer - Main Application Component
 * Root component that provides global configuration and routing
 */
import React from 'react';
import { QueryClientProvider, ErrorBoundary } from './providers';
import AppRouter from './AppRouter';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider>
        <AppRouter />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
