/**
 * The backend data contract (plan.md §2) uses PascalCase DynamoDB attribute
 * names: AssetID, OwnerUsername, NamaAset, Deskripsi, Kategori, HargaJuta,
 * ThumbnailKey, File3DKey, CreatedAt, UpdatedAt. This helper normalizes that
 * (tolerating snake_case/camelCase fallbacks in case the API layer reshapes
 * it) into one stable shape the rest of the app can rely on.
 */

const pick = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
};

// Base URL of the S3 / MiniStack bucket, e.g. http://localhost:4566/vertex-assets
// Set VITE_S3_BASE_URL in .env. If your setup separates endpoint and bucket name,
// also set VITE_S3_BUCKET and leave the bucket out of VITE_S3_BASE_URL.
const S3_BASE_URL = (import.meta.env.VITE_S3_BASE_URL || '').replace(/\/+$/, '');
const S3_BUCKET = (import.meta.env.VITE_S3_BUCKET || '').replace(/^\/+|\/+$/g, '');

/**
 * Resolves a value that may already be a usable URL (presigned URL, or a
 * plain public URL returned by the backend) OR a raw S3 object key
 * (e.g. "thumbnails/abc-123.png", possibly with a leading slash) into a URL
 * the browser can actually fetch.
 */
function resolveFileUrl(candidate) {
  if (!candidate) return null;

  // Already a usable absolute URL (presigned or public) - use as-is.
  if (/^https?:\/\//i.test(candidate)) return candidate;

  // Otherwise treat it as an S3 object key. Without a configured bucket base
  // we have no way to build a real URL, so surface null and let the UI show
  // a "preview unavailable" state instead of a broken <img>/404.
  if (!S3_BASE_URL) return null;

  const key = candidate.replace(/^\/+/, '');
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return S3_BUCKET
    ? `${S3_BASE_URL}/${S3_BUCKET}/${encodedKey}`
    : `${S3_BASE_URL}/${encodedKey}`;
}

export function normalizeAsset(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const thumbnailKey = pick(raw, ['ThumbnailKey', 'thumbnail_key', 'thumbnailKey']);
  const file3dKey = pick(raw, ['File3DKey', 'file_3d_key', 'file3DKey']);
  const thumbnailUrlField = pick(raw, ['ThumbnailURL', 'ThumbnailUrl', 'thumbnail_url', 'thumbnailUrl']);
  const file3dUrlField = pick(raw, ['File3DURL', 'File3DUrl', 'file_3d_url', 'file3DUrl']);

  return {
    id: pick(raw, ['AssetID', 'asset_id', 'assetId', 'id']),
    ownerUsername: pick(raw, ['OwnerUsername', 'owner_username', 'ownerUsername']),
    name: pick(raw, ['NamaAset', 'nama_aset', 'name']) ?? '',
    description: pick(raw, ['Deskripsi', 'deskripsi', 'description']) ?? '',
    category: pick(raw, ['Kategori', 'kategori', 'category']) ?? '',
    priceJuta: Number(pick(raw, ['HargaJuta', 'harga_juta', 'priceJuta']) ?? 0),
    thumbnailKey,
    file3dKey,
    // Prefer an explicit URL field from the API; fall back to resolving the key.
    thumbnailUrl: resolveFileUrl(thumbnailUrlField ?? thumbnailKey),
    file3dUrl: resolveFileUrl(file3dUrlField ?? file3dKey),
    createdAt: pick(raw, ['CreatedAt', 'created_at', 'createdAt']),
    updatedAt: pick(raw, ['UpdatedAt', 'updated_at', 'updatedAt']),
  };
}

export function normalizeAssetList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeAsset).filter(Boolean);
}

export const ASSET_CATEGORIES = ['Environment', 'Character', 'Props', 'Vehicle', 'Architecture', 'Other'];

const PREVIEWABLE_3D_EXTENSIONS = ['obj', 'fbx'];

/** Returns 'obj' | 'fbx' | null based on the file URL's extension. */
export function get3dPreviewFormat(fileUrl) {
  if (!fileUrl) return null;
  const clean = fileUrl.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop()?.toLowerCase();
  return PREVIEWABLE_3D_EXTENSIONS.includes(ext) ? ext : null;
}
