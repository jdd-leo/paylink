import { FormEvent, useEffect, useState } from 'react';
import { api, assetUrl } from '../api';

interface UpsellProduct {
  id: string;
  name: string;
  description: string | null;
  photoPath: string | null;
  price: number;
  active: boolean;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  active: true,
};

function parseMoney(raw: string): number {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function UpsellProducts() {
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.get<UpsellProduct[]>('/upsell-products').then((res) => setProducts(res.data));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPhoto(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: UpsellProduct) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price).replace('.', ','),
      active: p.active,
    });
    setPhoto(null);
    setError('');
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const price = parseMoney(form.price);
    if (!form.name.trim() || price <= 0) {
      setError('Informe nome e um valor válido.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.description.trim()) fd.append('description', form.description.trim());
      fd.append('price', String(price));
      fd.append('active', String(form.active));
      if (photo) fd.append('photo', photo);

      if (editingId) {
        await api.patch(`/upsell-products/${editingId}`, fd);
      } else {
        await api.post('/upsell-products', fd);
      }
      setShowForm(false);
      setForm(emptyForm);
      setPhoto(null);
      setEditingId(null);
      load();
    } catch {
      setError('Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: UpsellProduct) {
    const fd = new FormData();
    fd.append('active', String(!p.active));
    await api.patch(`/upsell-products/${p.id}`, fd);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Excluir este produto?')) return;
    await api.delete(`/upsell-products/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Produtos de upsell</h1>
        <button
          onClick={showForm ? () => setShowForm(false) : openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
        >
          {showForm ? 'Cancelar' : 'Cadastrar produto'}
        </button>
      </div>

      <p className="text-sm text-slate-500 -mt-2">
        Produtos do seu catálogo que podem ser oferecidos como adicional nos links,
        somando ao valor do Pix.
      </p>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
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
              Descrição (opcional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  R$
                </span>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <label className="flex items-center gap-2 h-[42px] px-3 rounded-lg border border-slate-300">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span className="text-sm text-slate-700">
                  {form.active ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Foto (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-indigo-700"
            />
            {photo && (
              <img
                src={URL.createObjectURL(photo)}
                alt=""
                className="mt-2 h-16 w-16 rounded-lg object-cover border border-slate-200"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
          >
            {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar produto'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {products.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
            Nenhum produto cadastrado.
          </div>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4"
          >
            {p.photoPath ? (
              <img
                src={assetUrl(p.photoPath)}
                alt={p.name}
                className="h-14 w-14 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-slate-100 text-slate-300 flex items-center justify-center shrink-0 text-xs">
                sem foto
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    p.active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {p.description && (
                <p className="text-sm text-slate-500 truncate">{p.description}</p>
              )}
              <p className="text-sm font-medium text-slate-700">{formatBRL(p.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                onClick={() => toggleActive(p)}
                className="text-sm text-slate-500 hover:text-indigo-600"
              >
                {p.active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => openEdit(p)}
                className="text-sm text-slate-500 hover:text-indigo-600"
              >
                Editar
              </button>
              <button
                onClick={() => remove(p.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
