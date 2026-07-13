import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

// Mirrors services/validators.py RegisterInput + the same-as-username check
// in services/auth_service.py register_user(). No digit/symbol requirement
// is enforced by the backend, so we don't add one here either.
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username minimal 3 karakter.')
      .max(30, 'Username maksimal 30 karakter.')
      .regex(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, dan underscore.'),
    email: z
      .string()
      .min(5, 'Email minimal 5 karakter.')
      .max(100, 'Email maksimal 100 karakter.')
      .email('Format email tidak valid.'),
    password: z
      .string()
      .min(8, 'Minimal 8 karakter.')
      .max(128, 'Maksimal 128 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.password.toLowerCase() !== data.username.toLowerCase(), {
    message: 'Password tidak boleh sama dengan username.',
    path: ['password'],
  });
