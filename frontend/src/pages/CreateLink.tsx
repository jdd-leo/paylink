import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

interface PixKeyOption {
  id: string;
  type: string;
  key: string;
  label: string | null;
}

const DEFAULT_CTA = 'Garanta seu produto agora mesmo';
const MAX_PHOTOS = 5;

export function CreateLink() {
  const navigate = useNavigate();
  const [pixKeys, setPixKeys] = useState<PixKeyOption[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaPhrase, setCtaPhrase] = useState(DEFAULT_CTA);
  const [amount, setAmount] = useState('');
  const [expirationHours, setExpirationHours] = useState(1);
  const [pixKeyId, setPixKeyId] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<PixKeyOption[]>('/pix-keys').then((res) => {
      setPixKeys(res.data);
      if (res.data[0]) setPixKeyId(res.data[0].id);
    });
  }, []);

  function onPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos(Array.from(files).slice(0, MAX_PHOTOS));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!pixKeyId) {
      setError('Cadastre uma chave Pix antes de criar um link.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('ctaPhrase', ctaPhrase || DEFAULT_CTA);
      if (amount.trim()) {
        fd.append('amount', amount.replace(',', '.'));
      }
      fd.append('expirationHours', String(expirationHours));
      fd.append('pixKeyId', pixKeyId);
      photos.forEach((p) => fd.append('photos', p));
      await api.post('/links', fd);
      navigate('/dashboard');
    } catch {
      setError('Não foi possível criar o link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Criar link</h1>

      {pixKeys.length === 0 && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Você ainda não tem chaves Pix.{' '}
          <a href="/dashboard/pix" className="underline font-medium">
            Cadastre uma chave
          </a>{' '}
          para continuar.
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Título</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Descrição do produto
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Frase chamativa
          </label>
          <input
            value={ctaPhrase}
            onChange={(e) => setCtaPhrase(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Valor (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2"
            />
          </div>
          <p className="text-xs text-slate-400">
            Deixe em branco para o cliente informar o valor no app do banco.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Expiração da oferta: {expirationHours}h
            </label>
            <input
              type="range"
              min={1}
              max={24}
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Chave Pix para receber
            </label>
            <select
              value={pixKeyId}
              onChange={(e) => setPixKeyId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {pixKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label || `${k.type} · ${k.key}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Fotos do produto (até {MAX_PHOTOS})
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onPhotos(e.target.files)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-indigo-700"
          />
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-2">
              {photos.map((p, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(p)}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || pixKeys.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-5 py-2.5 text-sm"
        >
          {saving ? 'Criando...' : 'Cadastrar link'}
        </button>
      </form>
    </div>
  );
}
