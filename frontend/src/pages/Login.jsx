import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchemas';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values) {
    setServerError('');
    const result = await login(values.username, values.password);
    if (result.success) {
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } else {
      setServerError(result.message);
    }
  }

  return (
    <main className="grow flex items-center justify-center p-4 py-16 relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-100 h-100 bg-primary/10 rounded-full blur-[100px] mix-blend-screen -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-87.5 h-87.5 bg-secondary/10 rounded-full blur-[100px] mix-blend-screen translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-110">
        <div className="glass-floating rounded-lg p-8 md:p-12 flex flex-col items-center">
          <div className="text-center mb-stack-lg w-full">
            <h2 className="font-label text-headline-md mb-2 text-on-surface">Login</h2>
            <p className="font-body text-body-md text-on-surface-variant">
              Login untuk melanjutkan ke dashboard Ruang Dimensi.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 w-full p-3 bg-error-container/20 border border-error/50 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
              <p className="font-body text-body-sm text-error">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-stack-md">
            <div className="flex flex-col gap-stack-xs group">
              <label
                className="font-label text-label-sm text-on-surface-variant ml-1 uppercase tracking-wider"
                htmlFor="username">
                Username
              </label>
              <div className="relative rounded-xl transition-shadow duration-300 group-focus-within:shadow-[0_0_15px_rgba(180,197,255,0.35)]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">
                  person
                </span>
                <input
                  {...register('username')}
                  id="username"
                  className="w-full bg-surface-container-lowest/50 backdrop-blur-sm border border-white/10 rounded-xl py-3.5 pl-12 pr-4 font-body text-body-md text-on-surface placeholder:text-outline-variant focus:bg-surface-container-lowest focus:border-primary/60 focus:outline-none transition-all"
                  placeholder="Username"
                  type="text"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="font-body text-label-sm text-error ml-1">{errors.username.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-stack-xs group">
              <label
                className="font-label text-label-sm text-on-surface-variant ml-1 uppercase tracking-wider"
                htmlFor="password">
                Password
              </label>
              <div className="relative rounded-xl transition-shadow duration-300 group-focus-within:shadow-[0_0_15px_rgba(180,197,255,0.35)]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">
                  lock
                </span>
                <input
                  {...register('password')}
                  id="password"
                  className="w-full bg-surface-container-lowest/50 backdrop-blur-sm border border-white/10 rounded-xl py-3.5 pl-12 pr-12 font-body text-body-md text-on-surface placeholder:text-outline-variant focus:bg-surface-container-lowest focus:border-primary/60 focus:outline-none transition-all"
                  placeholder="********"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"/>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="font-body text-label-sm text-error ml-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-stack-sm w-full bg-primary text-on-primary py-4 rounded-xl font-label text-label-md font-bold shadow-[0_4px_14px_0_rgba(180,197,255,0.39)] hover:shadow-[0_6px_20px_rgba(180,197,255,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none">
              {isSubmitting ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="mt-stack-lg w-full text-center">
            <span className="font-body text-body-md text-on-surface-variant">Belum punya akun? </span>
            <Link
              className="font-label text-label-md text-primary hover:text-primary-fixed transition-colors ml-1 font-semibold"
              to="/register">
              Buat akun
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}