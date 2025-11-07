/**
 * App layer - Query Client Provider
 * Provides React Query client for the entire application
 */
import React from 'react';
import { QueryClient, QueryClientProvider as ReactQueryProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const QueryClientProvider = ({ children }) => {
  return (
    <ReactQueryProvider client={queryClient}>
      {children}
    </ReactQueryProvider>
  );
};

export default QueryClientProvider;
