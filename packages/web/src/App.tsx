import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

import { Button, Toaster, TooltipProvider } from '@agent-x/design';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppRoutes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

class ErrorBoundary extends Component<
  { readonly children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please refresh the page.
          </p>
          <Button variant="link" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
