import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="grow flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
      <span className="font-label text-label-sm text-on-surface-variant uppercase tracking-widest">
        Error 404
      </span>
      <h1 className="font-label text-headline-lg text-on-surface">Node not found</h1>
      <p className="font-body text-body-md text-on-surface-variant max-w-md">
        The path you requested doesn't map to any known route in this engine.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Return to browse
      </Link>
    </main>
  );
}
