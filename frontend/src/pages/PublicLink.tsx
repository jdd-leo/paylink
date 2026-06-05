import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { api, assetUrl } from '../api';
import { Countdown } from '../components/Countdown';
import { buildPixPayload, PixKeyType } from '../lib/pix';

interface UpsellItem {
  id: string;
  name: string;
  description: string | null;
  photoPath: string | null;
  price: number;
}

interface PublicLinkData {
  code: string;
  title: string;
  description: string;
  amount: number | null;
  shipping: number | null;
  products: { name: string; price: number }[];
  upsells: UpsellItem[];
  ctaPhrase: string;
  expiresAt: string;
  expired: boolean;
  photos: string[];
  merchant: { tradeName: string; logoPath: string | null };
  pix: {
    payload: string;
    key: string;
    type: string;
    merchantName: string;
    merchantCity: string;
    txid: string;
  };
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PublicLink() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<PublicLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [selectedUpsell, setSelectedUpsell] = useState<Set<string>>(new Set());
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const upsellTotal = useMemo(() => {
    if (!data) return 0;
    return data.upsells
      .filter((u) => selectedUpsell.has(u.id))
      .reduce((sum, u) => sum + u.price, 0);
  }, [data, selectedUpsell]);

  const total = (data?.amount ?? 0) + upsellTotal;

  // Recalcula o BR Code Pix no cliente conforme o cliente adiciona upsells.
  const pixPayload = useMemo(() => {
    if (!data) return '';
    if (selectedUpsell.size === 0) return data.pix.payload;
    return buildPixPayload({
      key: data.pix.key,
      keyType: data.pix.type as PixKeyType,
      merchantName: data.pix.merchantName,
      merchantCity: data.pix.merchantCity,
      amount: total > 0 ? total.toFixed(2) : undefined,
      txid: data.pix.txid,
    });
  }, [data, selectedUpsell, total]);

  function toggleUpsell(id: string) {
    setSelectedUpsell((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    api
      .get<PublicLinkData>(`/public/links/${code}`)
      .then((res) => {
        setData(res.data);
        setExpired(res.data.expired);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  async function copyPix() {
    if (!data) return;
    await navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Carregando...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Link não encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Marca do vendedor */}
        <header className="flex items-center gap-3 px-1">
          {data.merchant.logoPath ? (
            <img
              src={assetUrl(data.merchant.logoPath)}
              alt={data.merchant.tradeName}
              className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl">
              {data.merchant.tradeName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <p className="text-xl font-bold text-slate-900">{data.merchant.tradeName}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 1.5l6.5 2.5v5c0 4.2-2.8 7.6-6.5 9-3.7-1.4-6.5-4.8-6.5-9v-5L10 1.5zm3.4 6.1a1 1 0 00-1.4-1.4L9 9.2 7.9 8.1A1 1 0 106.5 9.5l1.8 1.8c.4.4 1 .4 1.4 0l3.7-3.7z"
                  clipRule="evenodd"
                />
              </svg>
              Pagamento seguro via Pix
            </p>
          </div>
        </header>

        {/* 1. Informações do produto */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              {data.title}
            </h1>

            {data.amount != null && (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {data.amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
                <span className="text-sm font-medium text-emerald-600">à vista no Pix</span>
              </div>
            )}

            {data.description && (
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {data.description}
              </p>
            )}

            {data.products.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
                {data.products.map((p, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <span>{p.name}</span>
                    <span className="tabular-nums">{formatBRL(p.price)}</span>
                  </div>
                ))}
                {data.shipping != null && (
                  <div className="flex justify-between text-slate-600">
                    <span>Frete</span>
                    <span className="tabular-nums">{formatBRL(data.shipping)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {data.ctaPhrase && (
            <div className="bg-indigo-50 border-t border-indigo-100 px-5 py-3">
              <p className="text-indigo-700 font-semibold text-center">
                {data.ctaPhrase}
              </p>
            </div>
          )}
        </section>

        {/* 2. Fotos do produto */}
        {data.photos.length > 0 && (
          <section className="space-y-2">
            <div className="aspect-square w-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src={assetUrl(data.photos[activePhoto])}
                alt={data.title}
                className="h-full w-full object-cover"
              />
            </div>
            {data.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`h-16 w-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      i === activePhoto
                        ? 'border-indigo-600 ring-2 ring-indigo-100'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={assetUrl(p)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Produtos de upsell */}
        {!expired && data.upsells.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="font-semibold text-slate-900">Adicione ao seu pedido</p>
              <p className="text-xs text-indigo-600 font-medium">
                Promoções exclusivas somente aqui!
              </p>
            </div>
            <div className="p-3 space-y-2">
              {data.upsells.map((u) => {
                const selected = selectedUpsell.has(u.id);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                      selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    {u.photoPath ? (
                      <button
                        type="button"
                        onClick={() => setZoomPhoto(assetUrl(u.photoPath) ?? null)}
                        className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                        aria-label={`Ampliar foto de ${u.name}`}
                      >
                        <img
                          src={assetUrl(u.photoPath)}
                          alt={u.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-slate-100 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{u.name}</p>
                      {u.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {u.description}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-slate-700">
                        {formatBRL(u.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleUpsell(u.id)}
                      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {selected ? 'Remover' : 'Adicionar'}
                    </button>
                  </div>
                );
              })}
            </div>
            {total > 0 && (
              <div className="flex items-baseline justify-between border-t border-slate-100 px-5 py-3">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatBRL(total)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* 4. Pagamento via Pix */}
        {!expired ? (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                A oferta expira em
              </p>
              <div className="mt-1">
                <Countdown
                  expiresAt={data.expiresAt}
                  onExpire={() => setExpired(true)}
                />
              </div>
            </div>

            <div className="p-5 flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <QRCodeCanvas value={pixPayload} size={220} />
              </div>
              <p className="text-sm text-slate-500 text-center">
                Abra o app do seu banco e escaneie o QR Code para pagar
              </p>

              <div className="w-full">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span className="h-px flex-1 bg-slate-200" />
                  ou use o Pix copia e cola
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pixPayload}
                    className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                  />
                  <button
                    onClick={copyPix}
                    className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg px-4 shrink-0 transition"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-1">
            <p className="text-lg font-semibold text-slate-700">Oferta expirada</p>
            <p className="text-sm text-slate-500">
              O prazo para este pagamento se encerrou.
            </p>
          </section>
        )}

        <footer className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 1110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z"
              clipRule="evenodd"
            />
          </svg>
          Ambiente seguro · seus dados são protegidos
        </footer>
      </div>

      {zoomPhoto && (
        <div
          onClick={() => setZoomPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <button
            onClick={() => setZoomPhoto(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Fechar"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <img
            src={zoomPhoto}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
