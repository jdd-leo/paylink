import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, assetUrl } from '../api';
import { useAuth, type UserPlan, type UserRole } from '../auth';

interface ManagedUser {
  id: string;
  name: string;
  tradeName: string;
  email: string;
  logoPath: string | null;
  role: UserRole;
  plan: UserPlan;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ROOT: 'Root',
  CREATOR: 'Creator',
};

const PLAN_LABELS: Record<UserPlan, string> = {
  FREE: 'Free',
  CREATOR: 'Creator',
  PRO: 'Pro',
};

const emptyForm = {
  name: '',
  tradeName: '',
  email: '',
  password: '',
  role: 'CREATOR' as UserRole,
  plan: 'FREE' as UserPlan,
};

export function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [logo, setLogo] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.get<ManagedUser[]>('/users').then((res) => setUsers(res.data));
  }

  useEffect(load, []);

  if (user && user.role !== 'ROOT') {
    return <Navigate to="/dashboard" replace />;
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setLogo(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(u: ManagedUser) {
    setEditingId(u.id);
    setForm({
      name: u.name,
      tradeName: u.tradeName,
      email: u.email,
      password: '',
      role: u.role,
      plan: u.plan,
    });
    setLogo(null);
    setError('');
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('tradeName', form.tradeName);
    fd.append('email', form.email);
    fd.append('role', form.role);
    fd.append('plan', form.plan);
    if (form.password) fd.append('password', form.password);
    if (logo) fd.append('logo', logo);
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, fd);
      } else {
        await api.post('/users', fd);
      }
      setShowForm(false);
      setForm(emptyForm);
      setLogo(null);
      setEditingId(null);
      load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Não foi possível salvar o usuário.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este usuário? Os links e chaves Pix dele também serão removidos.')) return;
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
        >
          {showForm ? 'Cancelar' : 'Novo usuário'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 grid gap-4 sm:grid-cols-2"
        >
          {error && (
            <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Nome fantasia
            </label>
            <input
              required
              value={form.tradeName}
              onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Senha {editingId && '(deixe em branco para manter)'}
            </label>
            <input
              type="password"
              required={!editingId}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Perfil</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Plano</label>
            <select
              value={form.plan}
              onChange={(e) =>
                setForm({ ...form, plan: e.target.value as UserPlan })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(PLAN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Logo {editingId && '(deixe em branco para manter)'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {users.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
            Nenhum usuário cadastrado.
          </div>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              {u.logoPath ? (
                <img
                  src={assetUrl(u.logoPath)}
                  alt="logo"
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {u.tradeName}
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {ROLE_LABELS[u.role]}
                  </span>
                  <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                    {PLAN_LABELS[u.plan]}
                  </span>
                </p>
                <p className="text-sm text-slate-500 truncate">{u.name}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => openEdit(u)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Editar
              </button>
              {u.id !== user?.id && (
                <button
                  onClick={() => remove(u.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
