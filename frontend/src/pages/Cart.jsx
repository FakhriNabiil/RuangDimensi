import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatHargaJuta } from '../utils/format';
import ImageWithFallback from '../components/ImageWithFallback';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Cart() {
  const { items, totalHargaJuta, status, removeItem, checkout } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  async function handleCheckout() {
    setIsCheckingOut(true);
    const result = await checkout();
    setIsCheckingOut(false);
    if (result.success) {
      navigate('/orders', { state: { justCheckedOut: true, orderId: result.order.OrderID } });
    }
  }

  if (status === 'loading') return <LoadingSpinner label="Loading cart" className="py-24" />;

  return (
    <main className="grow py-8 md:py-stack-xl px-margin-mobile md:px-margin-desktop max-w-container-max w-full mx-auto flex flex-col gap-stack-lg">
      <h1 className="font-label text-display-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
        Keranjang
      </h1>

      {items.length === 0 ? (
        <div className="glass-plate rounded-xl py-20 flex flex-col items-center justify-center text-center border-dashed">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">
            shopping_cart
          </span>
          <h3 className="font-label text-headline-md text-on-surface mb-2">Keranjang kosong</h3>
          <p className="font-body text-body-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Belum ada aset yang ditambahkan. Yuk jelajahi katalog.
          </p>
          <Link to="/" className="btn-primary">
            Cari Aset
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-8 flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-plate rounded-xl p-3 flex items-center gap-4"
              >
                <Link to={`/assets/${item.id}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-lowest">
                    <ImageWithFallback
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      iconSize={24}
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/assets/${item.id}`}
                    className="font-label text-headline-md text-on-surface truncate block hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="font-label text-label-sm text-on-surface-variant">
                    @{item.ownerUsername}
                  </p>
                </div>
                <div className="font-label text-body-md text-tertiary font-bold shrink-0">
                  {formatHargaJuta(item.priceJuta)}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-on-surface-variant hover:text-error transition-colors p-2"
                  aria-label="Remove from cart"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="glass-plate rounded-xl p-6 sticky top-24">
              <h2 className="font-label text-headline-md text-on-surface mb-4">Ringkasan</h2>
              <div className="flex justify-between font-body text-body-sm text-on-surface-variant mb-2">
                <span>{items.length} item</span>
                <span>{formatHargaJuta(totalHargaJuta)}</span>
              </div>
              <div className="flex justify-between font-label text-headline-md text-on-surface font-bold pt-4 mt-2 border-t border-white/10 mb-6">
                <span>Total</span>
                <span className="text-primary">{formatHargaJuta(totalHargaJuta)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full btn-primary text-label-md justify-center disabled:opacity-60"
              >
                {isCheckingOut ? 'Memproses…' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
