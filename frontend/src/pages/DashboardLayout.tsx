import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { assetUrl } from '../api';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/dashboard/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.logoPath && (
              <img
                src={assetUrl(user.logoPath)}
                alt="logo"
                className="h-9 w-9 rounded-full object-cover"
              />
            )}
            <span className="font-bold text-slate-900">{user?.tradeName}</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" end className={linkClass}>
              Links
            </NavLink>
            <NavLink to="/dashboard/pix" className={linkClass}>
              Chaves Pix
            </NavLink>
            <button
              onClick={onLogout}
              className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
