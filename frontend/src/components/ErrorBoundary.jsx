import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In a real deployment this would report to a monitoring service.
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-on-surface p-6 text-center">
          <span className="material-symbols-outlined text-[48px] text-error">error</span>
          <h1 className="font-label text-headline-lg font-semibold">Something broke on our end</h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-md">
            An unexpected error stopped this page from rendering. Try reloading — if it keeps
            happening, let us know what you were doing.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
