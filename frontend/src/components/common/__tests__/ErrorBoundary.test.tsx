import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary, { InlineError } from '@components/common/ErrorBoundary';

// ─── Helpers ─────────────────────────────────────────────
const ThrowingChild = ({ shouldThrow = true }) => {
  if (shouldThrow) throw new Error('Test explosion');
  return <div>All good</div>;
};

// Suppress React's noisy error boundary console output during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Error: Uncaught')) return;
    if (typeof args[0] === 'string' && args[0].includes('The above error')) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => { console.error = originalError; });

// ─── ErrorBoundary ───────────────────────────────────────
describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/');
  });

  it('recovers when the user clicks "Try Again"', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const Conditional = () => {
      if (shouldThrow) throw new Error('Boom');
      return <p>Recovered</p>;
    };

    render(
      <ErrorBoundary>
        <Conditional />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the error condition, then click retry
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });
});

// ─── InlineError ─────────────────────────────────────────
describe('InlineError', () => {
  it('renders the error message', () => {
    render(<InlineError message="Something failed" />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('shows a retry button when onRetry is provided', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();

    render(<InlineError message="Oops" onRetry={handleRetry} />);

    await user.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalledOnce();
  });

  it('does not show retry when onRetry is omitted', () => {
    render(<InlineError message="Oops" />);
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });
});
