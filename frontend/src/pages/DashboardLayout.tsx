import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { assetUrl } from '../api';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function onLogout() {
    setMenuOpen(false);
    logout();
    navigate('/dashboard/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  const navLinks = (
    <>
      <NavLink
        to="/dashboard"
        end
        className={linkClass}
        onClick={() => setMenuOpen(false)}
      >
        Início
      </NavLink>
      <NavLink
        to="/dashboard/links"
        className={linkClass}
        onClick={() => setMenuOpen(false)}
      >
        Links
      </NavLink>
      <NavLink
        to="/dashboard/pix"
        className={linkClass}
        onClick={() => setMenuOpen(false)}
      >
        Chaves Pix
      </NavLink>
      {user?.role === 'ROOT' && (
        <NavLink
          to="/dashboard/users"
          className={linkClass}
          onClick={() => setMenuOpen(false)}
        >
          Usuários
        </NavLink>
      )}
      <button
        onClick={onLogout}
        className="text-left sm:ml-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600"
      >
        Sair
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group min-w-0">
            {user?.logoPath && (
              <img
                src={assetUrl(user.logoPath)}
                alt="logo"
                className="h-9 w-9 rounded-full object-cover shrink-0"
              />
            )}
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
              {user?.tradeName}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">{navLinks}</nav>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="sm:hidden border-t border-slate-200 px-4 py-3 flex flex-col gap-1">
            {navLinks}
          </nav>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
