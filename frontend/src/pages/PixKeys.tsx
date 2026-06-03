import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

interface PixKey {
  id: string;
  type: PixKeyType;
  key: string;
  holderName: string;
  city: string;
  label: string | null;
}

const TYPE_LABELS: Record<PixKeyType, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  RANDOM: 'Chave aleatória',
};

const emptyForm = {
  type: 'EMAIL' as PixKeyType,
  key: '',
  holderName: '',
  city: '',
  label: '',
};

export function PixKeys() {
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.get<PixKey[]>('/pix-keys').then((res) => setKeys(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/pix-keys', form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch {
      setError('Não foi possível cadastrar a chave.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta chave Pix?')) return;
    await api.delete(`/pix-keys/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Chaves Pix</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
        >
          {showForm ? 'Cancelar' : 'Cadastrar chave Pix'}
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
            <label className="text-sm font-medium text-slate-700">Tipo</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as PixKeyType })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Chave</label>
            <input
              required
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Nome do titular
            </label>
            <input
              required
              value={form.holderName}
              onChange={(e) => setForm({ ...form, holderName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Cidade</label>
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Apelido (opcional)
            </label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              {saving ? 'Salvando...' : 'Salvar chave'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {keys.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
            Nenhuma chave Pix cadastrada.
          </div>
        )}
        {keys.map((k) => (
          <div
            key={k.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {k.label || TYPE_LABELS[k.type]}
              </p>
              <p className="text-sm text-slate-500">
                {TYPE_LABELS[k.type]} · {k.key}
              </p>
              <p className="text-xs text-slate-400">
                {k.holderName} · {k.city}
              </p>
            </div>
            <button
              onClick={() => remove(k.id)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
