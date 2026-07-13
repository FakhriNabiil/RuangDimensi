import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildAssetSchema } from '../schemas/assetSchema';
import { ASSET_CATEGORIES } from '../utils/normalizeAsset';
import { createAsset, updateAsset } from '../api/assets';
import { getApiErrorMessage } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';

/**
 * mode: 'create' | 'edit'
 * asset: normalized asset (required for 'edit', prefills fields; files stay optional on edit)
 */
export default function AssetModal({ mode, asset, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const toast = useToast();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(buildAssetSchema({ isEdit })),
    defaultValues: {
      NamaAset: asset?.name ?? '',
      Deskripsi: asset?.description ?? '',
      Kategori: asset?.category ?? '',
      HargaJuta: asset?.priceJuta ?? '',
    },
  });

  const thumbnail = watch('thumbnail');
  const file3D = watch('file3D');

  async function onSubmit(values) {
    setSubmitError('');
    const fields = {
      NamaAset: values.NamaAset,
      Deskripsi: values.Deskripsi,
      Kategori: values.Kategori,
      HargaJuta: values.HargaJuta,
    };
    const files = { thumbnail: values.thumbnail, file3D: values.file3D };

    try {
      const saved = isEdit ? await updateAsset(asset.id, fields, files) : await createAsset(fields, files);
      toast.success(isEdit ? 'Asset updated.' : 'Asset uploaded.');
      onSuccess(saved);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Gagal menyimpan aset. Coba lagi.'));
    }
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass-floating rounded-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">deployed_code</span>
            <h2 className="font-label text-headline-md text-on-surface m-0 leading-none">
              {isEdit ? 'Edit Asset' : 'Upload Asset'}
            </h2>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-white/5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            {submitError && (
              <div className="p-3 bg-error-container/20 border border-error/50 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
                <p className="font-body text-body-sm text-error">{submitError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <Field label="Asset Name" error={errors.NamaAset?.message}>
                  <input
                    {...register('NamaAset')}
                    className="input-field"
                    placeholder="e.g. Cyberpunk Hovercar"
                    type="text"
                  />
                </Field>

                <Field label="Category" error={errors.Kategori?.message}>
                  <div className="relative">
                    <select {...register('Kategori')} className="input-field appearance-none cursor-pointer">
                      <option value="">Select category...</option>
                      {ASSET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>
                </Field>

                <Field label="Price (IDR)" error={errors.HargaJuta?.message}>
                  <div className="flex items-center">
                    <span className="bg-surface-container-high border border-r-0 border-white/10 rounded-l-md px-3 py-2.5 font-label text-body-sm text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      {...register('HargaJuta')}
                      className="input-field rounded-l-none!"
                      placeholder="0"
                      type="number"
                      step="1000"
                      min="0"
                    />
                  </div>
                </Field>
              </div>

              <Field label="Description" error={errors.Deskripsi?.message} className="h-full">
                <textarea
                  {...register('Deskripsi')}
                  className="input-field h-full resize-none min-h-35"
                  placeholder="Describe polygon count, rigging details, texture resolution..."
                  rows={6}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-label text-label-sm text-on-surface-variant uppercase tracking-widest border-b border-white/10 pb-2">
                Asset Files
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileDropzone
                  icon="image"
                  label="Upload Thumbnail"
                  hint="JPG, PNG (max 5MB)"
                  fileName={thumbnail?.name}
                  error={errors.thumbnail?.message}
                  onChange={(file) => setValue('thumbnail', file, { shouldValidate: true })}
                  accept="image/jpeg,image/png,image/webp"
                />
                <FileDropzone
                  icon="view_in_ar"
                  label="Upload 3D Model"
                  hint=".GLB, .FBX, .OBJ (max 50MB)"
                  fileName={file3D?.name}
                  error={errors.file3D?.message}
                  onChange={(file) => setValue('file3D', file, { shouldValidate: true })}
                />
              </div>
              {isEdit && (
                <p className="font-body text-body-sm text-on-surface-variant">
                  Leave a file empty to keep the current one.
                </p>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {isSubmitting ? 'sync' : 'cloud_upload'}
              </span>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
        {label}
      </label>
      {children}
      {error && (
        <p className="font-body text-label-sm text-error flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          {error}
        </p>
      )}
    </div>
  );
}

function FileDropzone({ icon, label, hint, fileName, error, onChange, accept }) {
  return (
    <label
      className={`border border-dashed rounded-xl bg-surface-container-lowest/40 hover:bg-surface-container/60 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer group ${
        error ? 'border-error' : 'border-white/15'
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl mb-2">
        {icon}
      </span>
      <span className="font-body text-body-sm text-on-surface mb-1 truncate max-w-full">
        {fileName || label}
      </span>
      <span className="font-label text-label-sm text-on-surface-variant">{hint}</span>
      {error && <span className="font-label text-label-sm text-error mt-1">{error}</span>}
    </label>
  );
}
