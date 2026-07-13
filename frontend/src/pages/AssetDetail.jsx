import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAsset } from '../api/assets';
import { normalizeAsset, get3dPreviewFormat } from '../utils/normalizeAsset';
import { formatHargaJuta, formatDate } from '../utils/format';
import { getApiErrorMessage } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageWithFallback from '../components/ImageWithFallback';
import Model3DViewer from '../components/Model3DViewer';

export default function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, username } = useAuth();
  const { isInCart, addItem } = useCart();
  const [asset, setAsset] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getAsset(assetId)
      .then((data) => {
        if (cancelled) return;
        setAsset(normalizeAsset(data));
        setStatus('success');
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(getApiErrorMessage(error, 'Aset tidak ditemukan.'));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (status === 'loading') return <LoadingSpinner label="Loading asset" className="py-24" />;

  if (status === 'error') {
    return (
      <main className="grow py-16 px-margin-mobile md:px-margin-desktop max-w-container-max w-full mx-auto flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <p className="font-body text-body-md text-error">{errorMessage}</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>
          Back to browse
        </button>
      </main>
    );
  }

  const previewFormat = get3dPreviewFormat(asset.file3dUrl);
  const isOwnAsset = isLoggedIn && username === asset.ownerUsername;
  const alreadyInCart = isInCart(asset.id);

  async function handleAddToCart() {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: `/assets/${assetId}` } } });
      return;
    }
    setIsAdding(true);
    await addItem(asset.id);
    setIsAdding(false);
  }

  return (
    <main className="grow py-8 md:py-stack-xl px-margin-mobile md:px-margin-desktop max-w-container-max w-full mx-auto flex flex-col gap-stack-xl">
      <Link
        to="/"
        className="font-label text-label-sm text-on-surface-variant hover:text-primary w-fit flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: 3D Preview Canvas */}
        <div className="lg:col-span-8 h-90 md:h-140 rounded-lg glass-plate relative overflow-hidden group">
          {previewFormat && (
            <span className="absolute top-3 left-3 z-10 font-label text-label-sm text-primary bg-surface/80 px-2 py-1 rounded backdrop-blur-md uppercase pointer-events-none">
              .{previewFormat} — drag to orbit
            </span>
          )}
          {previewFormat ? (
            <Model3DViewer fileUrl={asset.file3dUrl} format={previewFormat} className="w-full h-full" />
          ) : (
            <ImageWithFallback
              src={asset.thumbnailUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
              iconSize={48}
            />
          )}
        </div>

        {/* Right: Metadata & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-stack-lg">
          <div className="glass-plate p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4 gap-3">
              <h1 className="font-label text-headline-lg text-on-surface tracking-tight">
                {asset.name}
              </h1>
              <span className="shrink-0 bg-secondary/10 text-secondary font-label text-label-sm px-3 py-1 rounded-full border border-secondary/20 uppercase">
                {asset.category || '—'}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  account_circle
                </span>
              </div>
              <div>
                <p className="font-label text-label-md text-on-surface">
                  By <span className="text-primary">@{asset.ownerUsername}</span>
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                Price
              </p>
              <div className="font-label text-display-lg-mobile text-primary font-bold tracking-tight">
                {formatHargaJuta(asset.priceJuta)}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isOwnAsset ? (
                <p className="w-full text-center font-label text-label-md text-on-surface-variant border border-white/10 rounded-full py-3.5">
                  Aset ini milik Anda.
                </p>
              ) : alreadyInCart ? (
                <Link
                  to="/cart"
                  className="w-full bg-transparent border border-primary/50 text-primary font-label text-label-md font-bold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:bg-primary/10"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  Sudah di Keranjang — Lihat
                </Link>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-transparent border border-primary/50 text-primary font-label text-label-md font-bold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:bg-primary/10 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isAdding ? 'progress_activity' : 'add_shopping_cart'}
                  </span>
                  {isAdding ? 'Menambahkan…' : 'Tambah ke Keranjang'}
                </button>
              )}

              {asset.file3dUrl && (
                <a
                  href={asset.file3dUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-primary-container text-on-primary-container font-label text-label-md font-bold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(98,138,255,0.6)] hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download 3D File
                </a>
              )}
            </div>

            {asset.description && (
              <p className="font-body text-body-sm text-on-surface-variant mt-6 pt-6 border-t border-white/10">
                {asset.description}
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="font-label text-headline-md text-on-surface mb-4">
                Technical Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <SpecTile icon="category" label="Category" value={asset.category || '—'} />
                <SpecTile icon="event" label="Uploaded" value={formatDate(asset.createdAt)} />
                <SpecTile icon="update" label="Updated" value={formatDate(asset.updatedAt)} />
                {previewFormat && (
                  <SpecTile icon="view_in_ar" label="Format" value={`.${previewFormat.toUpperCase()}`} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecTile({ icon, label, value }) {
  return (
    <div className="bg-surface-container-low p-3 rounded-lg border border-white/5">
      <p className="font-label text-label-sm text-on-surface-variant mb-1">{label}</p>
      <p className="font-label text-label-md text-on-surface font-semibold flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-tertiary">{icon}</span>
        {value}
      </p>
    </div>
  );
}
