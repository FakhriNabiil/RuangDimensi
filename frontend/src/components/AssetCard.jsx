import { Link, useNavigate } from 'react-router-dom';
import { formatHargaJuta } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ImageWithFallback from './ImageWithFallback';

export default function AssetCard({ asset }) {
  const navigate = useNavigate();
  const { isLoggedIn, username } = useAuth();
  const { isInCart, addItem } = useCart();

  const isOwnAsset = isLoggedIn && username === asset.ownerUsername;
  const alreadyInCart = isInCart(asset.id);

  function handleQuickAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: `/assets/${asset.id}` } } });
      return;
    }
    if (alreadyInCart) {
      navigate('/cart');
      return;
    }
    addItem(asset.id);
  }

  return (
    <Link
      to={`/assets/${asset.id}`}
      className="glass-plate hover-lift hover-img-lift rounded-xl overflow-hidden group relative flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-48 w-full overflow-hidden bg-surface-container-lowest">
        <ImageWithFallback
          src={asset.thumbnailUrl}
          alt={asset.name}
          className="w-full h-full object-cover"
          iconSize={40}
        />
        <div className="absolute top-5 left-4 flex gap-1">
          <span className="bg-secondary-container/80 text-on-secondary-container font-label text-label-sm px-2 py-0.5 rounded backdrop-blur-md uppercase">
            {asset.category || '—'}
          </span>
        </div>
        {!isOwnAsset && (
          <button
            onClick={handleQuickAdd}
            title={alreadyInCart ? 'Lihat keranjang' : 'Tambah ke keranjang'}
            className={`absolute top-5 right-4 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 z-10 ${
              alreadyInCart
                ? 'bg-primary text-on-primary'
                : 'bg-surface/70 text-on-surface hover:bg-primary hover:text-on-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {alreadyInCart ? 'shopping_cart' : 'add_shopping_cart'}
            </span>
          </button>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
          <span className="btn-primary text-label-md flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Quick View
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h2 className="font-label text-headline-md text-on-surface truncate">{asset.name}</h2>
          <p className="font-label text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-outline">account_circle</span>
            {asset.ownerUsername}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3">
          <span className="font-label text-headline-md text-tertiary font-bold">
            {formatHargaJuta(asset.priceJuta)}
          </span>
        </div>
      </div>
    </Link>
  );
}
