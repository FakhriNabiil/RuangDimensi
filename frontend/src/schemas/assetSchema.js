import { z } from 'zod';
import { ASSET_CATEGORIES } from '../utils/normalizeAsset';

const MAX_THUMBNAIL_MB = 5;
const MAX_FILE3D_MB = 50;
// Mirrors config/settings.py ALLOWED_THUMBNAIL_TYPES exactly, so the client
// rejects a file before upload instead of the backend bouncing it after.
const ALLOWED_THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function buildAssetSchema({ isEdit }) {
  return z.object({
    NamaAset: z.string().min(1, 'Nama aset wajib diisi.').max(100, 'Maksimal 100 karakter.'),
    Deskripsi: z.string().max(500, 'Maksimal 500 karakter.').optional().or(z.literal('')),
    Kategori: z.enum(ASSET_CATEGORIES, { errorMap: () => ({ message: 'Pilih kategori.' }) }),
    HargaJuta: z
      .coerce.number({ invalid_type_error: 'Harga wajib berupa angka.' })
      .min(0, 'Harga tidak boleh negatif.'),
    thumbnail: z
      .any()
      .refine(
        (file) => isEdit || (file instanceof File && file.size > 0),
        'Thumbnail wajib diunggah.',
      )
      .refine(
        (file) => !(file instanceof File) || file.size <= MAX_THUMBNAIL_MB * 1024 * 1024,
        `Ukuran thumbnail maksimal ${MAX_THUMBNAIL_MB}MB.`,
      )
      .refine(
        (file) => !(file instanceof File) || ALLOWED_THUMBNAIL_MIME_TYPES.includes(file.type),
        'Thumbnail harus JPG, PNG, atau WEBP.',
      )
      .optional(),
    file3D: z
      .any()
      .refine(
        (file) => isEdit || (file instanceof File && file.size > 0),
        'File 3D wajib diunggah.',
      )
      .refine(
        (file) => !(file instanceof File) || file.size <= MAX_FILE3D_MB * 1024 * 1024,
        `Ukuran file 3D maksimal ${MAX_FILE3D_MB}MB.`,
      )
      .optional(),
  });
}
