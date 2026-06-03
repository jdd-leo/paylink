import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth';
import { Login } from './pages/Login';
import { DashboardLayout } from './pages/DashboardLayout';
import { LinksList } from './pages/LinksList';
import { CreateLink } from './pages/CreateLink';
import { PixKeys } from './pages/PixKeys';
import { PublicLink } from './pages/PublicLink';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LinksList />} />
        <Route path="links/new" element={<CreateLink />} />
        <Route path="pix" element={<PixKeys />} />
      </Route>
      <Route path="/p/:code" element={<PublicLink />} />
      <Route path="*" element={<div className="p-8">Página não encontrada</div>} />
    </Routes>
  );
}
