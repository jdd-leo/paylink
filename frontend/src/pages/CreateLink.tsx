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
const MAX_PRODUCTS = 10;

interface ProductItem {
  name: string;
  value: string;
}

function parseMoney(raw: string): number {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function CreateLink() {
  const navigate = useNavigate();
  const [pixKeys, setPixKeys] = useState<PixKeyOption[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaPhrase, setCtaPhrase] = useState(DEFAULT_CTA);
  const [products, setProducts] = useState<ProductItem[]>([
    { name: '', value: '' },
  ]);
  const [shipping, setShipping] = useState('');
  const [expirationHours, setExpirationHours] = useState(1);
  const [pixKeyId, setPixKeyId] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const productsTotal = products.reduce((sum, p) => sum + parseMoney(p.value), 0);
  const total = productsTotal + parseMoney(shipping);

  useEffect(() => {
    api.get<PixKeyOption[]>('/pix-keys').then((res) => {
      setPixKeys(res.data);
      if (res.data[0]) setPixKeyId(res.data[0].id);
    });
  }, []);

  function updateProduct(index: number, field: keyof ProductItem, value: string) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function addProduct() {
    setProducts((prev) =>
      prev.length >= MAX_PRODUCTS ? prev : [...prev, { name: '', value: '' }],
    );
  }

  function removeProduct(index: number) {
    setProducts((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

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
    const cleanProducts = products
      .filter((p) => p.name.trim() && p.value.trim())
      .map((p) => ({ name: p.name.trim(), price: parseMoney(p.value) }));

    if (cleanProducts.some((p) => p.price <= 0)) {
      setError('Informe um valor válido para cada produto.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      if (description.trim()) {
        fd.append('description', description);
      }
      fd.append('ctaPhrase', ctaPhrase || DEFAULT_CTA);
      if (cleanProducts.length) {
        fd.append('products', JSON.stringify(cleanProducts));
      }
      if (shipping.trim()) {
        fd.append('shipping', String(parseMoney(shipping)));
      }
      fd.append('expirationHours', String(expirationHours));
      fd.append('pixKeyId', pixKeyId);
      photos.forEach((p) => fd.append('photos', p));
      await api.post('/links', fd);
      navigate('/dashboard/links');
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
            Descrição do pedido (opcional)
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Produtos
          </label>
          {products.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Nome do produto"
                value={p.name}
                onChange={(e) => updateProduct(i, 'name', e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2"
              />
              <div className="relative w-32 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  R$
                </span>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={p.value}
                  onChange={(e) => updateProduct(i, 'value', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-2 py-2"
                />
              </div>
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(i)}
                  className="shrink-0 w-10 rounded-lg border border-slate-300 text-slate-400 hover:text-red-600 hover:border-red-300"
                  aria-label="Remover produto"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {products.length < MAX_PRODUCTS && (
            <button
              type="button"
              onClick={addProduct}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Adicionar produto
            </button>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Frete (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              R$
            </span>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2"
            />
          </div>
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

        <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-2xl font-extrabold text-slate-900">
            {total.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
        {total === 0 && (
          <p className="text-xs text-slate-400 -mt-2">
            Sem valor definido — o cliente informa o valor no app do banco.
          </p>
        )}

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
