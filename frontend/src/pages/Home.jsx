import { useSearchParams } from 'react-router-dom';
import { useAssets } from '../hooks/useAssets';
import AssetCard from '../components/AssetCard';
import { ASSET_CATEGORIES } from '../utils/normalizeAsset';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? 'new';

  const { assets, status, errorMessage, refetch } = useAssets({ category, search, sort });

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasActiveFilters = Boolean(category || search);

  return (
    <div className="flex flex-1 max-w-container-max mx-auto w-full pt-stack-lg px-margin-mobile md:px-margin-desktop gap-gutter pb-stack-xl">
      {/* Left Sidebar (Filters) */}
      <aside className="hidden lg:block w-64 shrink-0 h-fit sticky top-24">
        <div className="glass-plate rounded-xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">filter_list</span>
            <h2 className="font-label text-headline-md text-on-surface">Filters</h2>
          </div>

          <div className="mb-6 border-b border-white/5 pb-6">
            <h3 className="font-label text-label-sm text-outline mb-3 uppercase tracking-widest">
              Category
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateParam('category', '')}
                className={`text-left font-body text-body-sm transition-colors ${
                  category === '' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua Kategori
              </button>
              {ASSET_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => updateParam('category', c)}
                  className={`text-left font-body text-body-sm transition-colors flex items-center gap-2 ${
                    category === c ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      category === c ? 'border-primary bg-primary/20' : 'border-outline-variant'
                    }`}
                  >
                    {category === c && (
                      <span className="material-symbols-outlined text-[12px] text-primary">check</span>
                    )}
                  </span>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <h3 className="font-label text-label-sm text-outline mb-3 uppercase tracking-widest">
              Sort By
            </h3>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 font-body text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="new">Terbaru</option>
              <option value="price_asc">Harga: Rendah ke Tinggi</option>
              <option value="price_desc">Harga: Tinggi ke Rendah</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full btn-ghost mt-4 rounded-lg! py-2! text-label-sm"
            >
              Hapus Filter
            </button>
          )}
        </div>
      </aside>

      {/* Main Content (Asset Grid) */}
      <main className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
          <div>
            <h1 className="font-label text-display-lg-mobile md:text-headline-lg text-on-surface mb-2">
              Cari Aset 3D
            </h1>
            <p className="font-body text-body-lg text-on-surface-variant">
              Eksplorasi berbagai aset 3D yang tersedia di marketplace. Temukan model yang sesuai dengan kebutuhan proyek Anda.
            </p>
          </div>

          {/* Mobile filter controls */}
          <div className="flex lg:hidden items-center gap-2 glass-plate rounded-xl p-2">
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
              className="bg-transparent border-none text-on-surface font-label text-label-sm focus:ring-0 outline-none"
            >
              <option value="">Kategori: Semua</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-transparent border-none text-on-surface font-label text-label-sm focus:ring-0 outline-none"
            >
              <option value="new">Terbaru</option>
              <option value="price_asc">Harga: Rendah ke Tinggi</option>
              <option value="price_desc">Harga: Tinggi ke Rendah</option>
            </select>
          </div>
        </div>

        {status === 'loading' && <SkeletonGrid />}

        {status === 'error' && (
          <div className="glass-plate rounded-xl border border-error/30 py-16 flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
            <p className="font-body text-body-md text-error">{errorMessage}</p>
            <button onClick={refetch} className="btn-ghost">
              Coba lagi
            </button>
          </div>
        )}

        {status === 'success' && assets.length === 0 && (
          <div className="glass-plate rounded-xl py-20 flex flex-col items-center justify-center text-center border-dashed">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">
              data_alert
            </span>
            <h3 className="font-label text-headline-md text-on-surface mb-2">No Assets Found</h3>
            <p className="font-body text-body-sm text-on-surface-variant max-w-md mx-auto mb-6">
              Tidak ada aset yang sesuai dengan filter yang diterapkan. Silakan ubah filter atau hapus filter untuk melihat semua aset.
            </p>
            <button onClick={clearFilters} className="btn-ghost">
              Hapus Filter
            </button>
          </div>
        )}

        {status === 'success' && assets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-plate rounded-xl flex flex-col overflow-hidden h-full">
          <div className="h-48 bg-surface-container-highest/60 animate-pulse" />
          <div className="p-4 flex flex-col grow gap-3">
            <div className="h-4 bg-surface-container-highest/60 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-surface-container-highest/60 rounded w-1/2 animate-pulse" />
            <div className="mt-auto h-4 bg-surface-container-highest/60 rounded w-1/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
