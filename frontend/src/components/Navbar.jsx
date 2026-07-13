import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ASSET_CATEGORIES } from '../utils/normalizeAsset';

export default function Navbar() {
  const { isLoggedIn, username, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');
    navigate(`/?${params.toString()}`);
  }

  function handleCategoryClick(e, category) {
    e.preventDefault();
    navigate(`/?category=${encodeURIComponent(category)}`);
  }

  return (
    <header className="sticky top-4 z-50 mx-auto w-[95%] max-w-container-max rounded-xl glass-floating flex items-center justify-between px-4 md:px-6 py-3 gap-4">
      <div className="flex items-center gap-6 min-w-0">
        <Link
          to="/"
          className="font-label text-headline-md font-bold text-primary tracking-tight shrink-0 scale-95 active:scale-90 transition-transform">
          Ruang Dimensi
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {ASSET_CATEGORIES.map((category) => (
            <a
              key={category}
              href={`/?category=${category}`}
              onClick={(e) => handleCategoryClick(e, category)}
              className="text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all duration-300 font-label text-label-md px-3 py-2 rounded-md">
              {category}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center relative w-56 lg:w-64 glass-plate rounded-full px-3 py-1.5 glow-focus transition-all duration-300">
          <span className="material-symbols-outlined text-outline-variant mr-2 text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-on-surface placeholder-outline-variant focus:ring-0 w-full text-sm font-label h-full outline-none"
            placeholder="Search assets..."
            type="text"/>
        </form>

        {isLoggedIn ? (
          <>
            <Link
              to="/orders"
              className="font-label text-label-md text-on-surface-variant hover:text-primary rounded-full px-3 py-2 hover:bg-white/5 transition-all duration-300"
              title="Riwayat Pembelian">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </Link>
            <Link
              to="/cart"
              className="relative font-label text-label-md text-on-surface-variant hover:text-primary rounded-full px-3 py-2 hover:bg-white/5 transition-all duration-300"
              title="Keranjang">
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-2 font-label text-label-md text-on-surface border border-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/5 hover:border-primary/50 transition-all duration-300">
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              {username}
            </Link>
            <button
              onClick={() => logout()}
              className="font-label text-label-md text-on-surface-variant hover:text-primary rounded-full px-4 py-2 hover:bg-white/5 transition-all duration-300">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="font-label text-label-md text-on-surface-variant hover:text-primary rounded-full px-4 py-2 hover:bg-white/5 transition-all duration-300">
              Login
            </Link>
            <Link to="/register" className="btn-primary text-label-md">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
