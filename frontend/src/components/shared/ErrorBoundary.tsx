import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-muted mb-6 text-base">
              An unexpected error occurred. Please refresh the page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-slate-900 text-slate-100 rounded-lg p-4 mb-6 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
