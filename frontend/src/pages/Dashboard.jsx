import { useCallback, useEffect, useState } from 'react';
import { getMyAssets, deleteAsset } from '../api/assets';
import { normalizeAssetList } from '../utils/normalizeAsset';
import { formatHargaJuta } from '../utils/format';
import { getApiErrorMessage } from '../api/axiosInstance';
import AssetModal from '../components/AssetModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageWithFallback from '../components/ImageWithFallback';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const toast = useToast();
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [modalState, setModalState] = useState(null); // { mode: 'create' | 'edit', asset? }
  const [pendingDelete, setPendingDelete] = useState(null); // asset
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyAssets = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getMyAssets();
      setAssets(normalizeAssetList(data));
      setStatus('success');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat aset kamu.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchMyAssets();
  }, [fetchMyAssets]);

  function handleModalSuccess() {
    setModalState(null);
    fetchMyAssets();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteAsset(pendingDelete.id);
      toast.success('Asset deleted.');
      setAssets((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menghapus aset.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="grow py-8 md:py-stack-xl px-margin-mobile md:px-margin-desktop max-w-container-max w-full mx-auto flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-label text-display-lg-mobile md:text-headline-lg text-on-surface mb-2 tracking-tight">
            My Assets
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl">
            Kelola model 3D yang telah Anda unggah.
          </p>
        </div>
        <button
          onClick={() => setModalState({ mode: 'create' })}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
          Upload Asset
        </button>
      </div>

      {status === 'loading' && <SkeletonGrid />}

      {status === 'error' && (
        <div className="glass-plate rounded-xl border border-error/30 py-16 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
          <p className="font-body text-body-md text-error">{errorMessage}</p>
          <button className="btn-ghost" onClick={fetchMyAssets}>
            Coba lagi
          </button>
        </div>
      )}

      {status === 'success' && assets.length === 0 && (
        <div className="glass-plate rounded-xl py-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6 border border-white/10">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
              inventory_2
            </span>
          </div>
          <h3 className="font-label text-headline-md text-on-surface mb-2">Belum ada aset</h3>
          <p className="font-body text-body-md text-on-surface-variant mb-8 max-w-md">
            Upload model 3D pertama Anda ke marketplace. Format yang didukung meliputi .OBJ dan .FBX.
          </p>
          <button onClick={() => setModalState({ mode: 'create' })} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload model 3D pertama Anda
          </button>
        </div>
      )}

      {status === 'success' && assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="glass-plate hover-lift rounded-xl overflow-hidden group flex flex-col h-full"
            >
              <div className="relative aspect-video overflow-hidden bg-surface-container-low">
                <ImageWithFallback
                  src={asset.thumbnailUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  iconSize={32}
                />
                <div className="absolute top-5 right-4 flex gap-2">
                  <span className="bg-secondary-container/80 text-on-secondary-container font-label text-label-sm px-2 py-0.5 rounded backdrop-blur-md uppercase">
                    {asset.category || '—'}
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-label text-headline-md text-on-surface mb-1 text-lg leading-tight truncate">
                  {asset.name}
                </h3>
                <p className="font-body text-body-sm text-on-surface-variant mb-4 line-clamp-2">
                  {asset.description || 'No description provided.'}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="font-label text-label-md text-tertiary font-bold">
                    {formatHargaJuta(asset.priceJuta)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalState({ mode: 'edit', asset })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center btn-danger-ghost hover:text-primary hover:border-primary"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => setPendingDelete(asset)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center btn-danger-ghost"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState && (
        <AssetModal
          mode={modalState.mode}
          asset={modalState.asset}
          onClose={() => setModalState(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete asset?"
        message={`"${pendingDelete?.name}" will be permanently removed, including its files. This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-plate rounded-xl overflow-hidden flex flex-col h-full">
          <div className="aspect-video bg-surface-container-highest/60 animate-pulse" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-4 w-3/4 bg-surface-container-highest/60 rounded animate-pulse" />
            <div className="h-3 w-full bg-surface-container-highest/60 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-surface-container-highest/60 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
