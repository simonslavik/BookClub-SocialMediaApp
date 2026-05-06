import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

/**
 * React Error Boundary — catches rendering errors and shows a fallback UI.
 * Wrap around route content or individual feature sections.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<CustomError />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI for error boundary.
 */
const ErrorFallback = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[400px] p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
        <FiAlertTriangle className="w-7 h-7 text-red-500" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2 font-display">
        Something went wrong
      </h2>
      <p className="text-sm text-gray-500 mb-6 font-outfit">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>

      {error?.message && (
        <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs text-red-600 font-mono break-all">{error.message}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-700 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors font-outfit"
        >
          <FiRefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-warmgray-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-warmgray-200 transition-colors font-outfit"
        >
          <FiHome className="w-4 h-4" />
          Go Home
        </a>
      </div>
    </div>
  </div>
);

/**
 * Inline error card for non-fatal errors within a section.
 * Use when an API call fails but the rest of the page is still usable.
 */
export const InlineError = ({ message, onRetry, className = '' }) => (
  <div className={`flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl ${className}`}>
    <FiAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
    <p className="flex-1 text-sm text-red-700 font-outfit">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex-shrink-0 text-sm text-red-600 hover:text-red-800 font-semibold underline font-outfit"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorBoundary;
