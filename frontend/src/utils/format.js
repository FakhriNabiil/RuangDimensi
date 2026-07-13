/**
 * HargaJuta stores the asset's price as a plain Rupiah amount (the field
 * name is a historical leftover — it's NOT scaled by millions). Formatted
 * as e.g. "Rp1.000.000,00".
 */
export function formatHargaJuta(hargaJuta) {
  const value = Number(hargaJuta);
  if (Number.isNaN(value)) return '—';
  if (value === 0) return 'Free';
  const formatted = value.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rp${formatted}`;
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!value || Number.isNaN(value)) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)}${units[unitIndex]}`;
}
