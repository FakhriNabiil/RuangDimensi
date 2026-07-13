import { useState } from 'react';

export default function ImageWithFallback({ src, alt, className = '', iconSize = 32 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-surface-container-lowest ${className}`}>
        <span
          className="material-symbols-outlined text-outline-variant"
          style={{ fontSize: iconSize }}
        >
          view_in_ar
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
