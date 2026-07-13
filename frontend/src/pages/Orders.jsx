import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listMyOrders } from '../api/orders';
import { getApiErrorMessage } from '../api/axiosInstance';
import { formatHargaJuta, formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    listMyOrders()
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
        setStatus('success');
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(getApiErrorMessage(error, 'Gagal memuat riwayat pembelian.'));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="grow py-8 md:py-stack-xl px-margin-mobile md:px-margin-desktop max-w-container-max w-full mx-auto flex flex-col gap-stack-lg">
      <h1 className="font-label text-display-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
        Riwayat Pembelian
      </h1>

      {location.state?.justCheckedOut && (
        <div className="glass-plate border border-primary/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">check_circle</span>
          <p className="font-body text-body-sm text-on-surface">
            Checkout berhasil! Pesanan {location.state.orderId?.slice(0, 8)} sudah tercatat.
          </p>
        </div>
      )}

      {status === 'loading' && <LoadingSpinner label="Loading orders" className="py-24" />}

      {status === 'error' && (
        <div className="glass-plate rounded-xl border border-error/30 py-16 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
          <p className="font-body text-body-md text-error">{errorMessage}</p>
        </div>
      )}

      {status === 'success' && orders.length === 0 && (
        <div className="glass-plate rounded-xl py-20 flex flex-col items-center justify-center text-center border-dashed">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">
            receipt_long
          </span>
          <h3 className="font-label text-headline-md text-on-surface mb-2">Belum ada pembelian</h3>
          <p className="font-body text-body-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Aset yang kamu beli akan muncul di sini.
          </p>
          <Link to="/" className="btn-primary">
            Browse Assets
          </Link>
        </div>
      )}

      {status === 'success' && orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.OrderID} className="glass-plate rounded-xl p-5">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-4 border-b border-white/10">
                <div>
                  <p className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Order #{order.OrderID.slice(0, 8)}
                  </p>
                  <p className="font-label text-label-sm text-on-surface-variant">
                    {formatDate(order.CreatedAt)}
                  </p>
                </div>
                <span className="bg-primary/10 text-primary font-label text-label-sm px-3 py-1 rounded-full border border-primary/20 uppercase">
                  {order.Status}
                </span>
              </div>
              <div className="flex flex-col gap-2 mb-4">
                {order.Items?.map((item) => (
                  <div key={item.AssetID} className="flex justify-between items-center gap-3">
                    <Link
                      to={`/assets/${item.AssetID}`}
                      className="font-body text-body-sm text-on-surface hover:text-primary transition-colors truncate"
                    >
                      {item.NamaAset}
                    </Link>
                    <span className="font-label text-body-sm text-on-surface-variant shrink-0">
                      {formatHargaJuta(item.HargaJuta)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="font-label text-label-md text-on-surface-variant">Total</span>
                <span className="font-label text-headline-md text-tertiary font-bold">
                  {formatHargaJuta(order.TotalHargaJuta)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
