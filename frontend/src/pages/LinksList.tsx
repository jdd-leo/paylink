import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, assetUrl } from '../api';
import { useAuth } from '../auth';

interface LinkItem {
  id: string;
  code: string;
  title: string;
  amount: string | null;
  ctaPhrase: string | null;
  expiresAt: string;
  createdAt: string;
  photos: { path: string }[];
  pixKey: { label: string | null; key: string };
}

interface ListResponse {
  items: LinkItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function LinksList() {
  const { user } = useAuth();
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<ListResponse>('/links', { params: { page, limit: 10 } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [page]);

  function publicUrl(code: string) {
    return `${location.origin}/p/${code}`;
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(publicUrl(code));
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  function buildMessage(item: LinkItem) {
    const store = user?.tradeName?.trim();
    const cta =
      item.ctaPhrase?.trim() ||
      'Garanta o seu agora — é rápido, seguro e pelo Pix.';
    const lines = [
      store ? `*${store}*` : null,
      item.title,
      '',
      `${cta}`,
      `Clique no link abaixo e acesse a página de pagamento:`,
      publicUrl(item.code),
    ].filter((line) => line !== null);
    return lines.join('\n');
  }

  async function copyMessage(item: LinkItem) {
    await navigator.clipboard.writeText(buildMessage(item));
    setCopiedMessage(item.code);
    setTimeout(() => setCopiedMessage(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Meus links</h1>
        <Link
          to="/dashboard/links/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
        >
          Criar link
        </Link>
      </div>

      {loading && <p className="text-slate-500">Carregando...</p>}

      {!loading && data && data.items.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
          Nenhum link criado ainda.
        </div>
      )}

      <div className="grid gap-3">
        {data?.items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
              {item.photos[0] && (
                <img
                  src={assetUrl(item.photos[0].path)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">
                {item.title}
                {item.amount != null && (
                  <span className="ml-2 text-emerald-600">
                    {Number(item.amount).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-500">
                Expira em {new Date(item.expiresAt).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-slate-400 truncate">
                Pix: {item.pixKey.label || item.pixKey.key}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={publicUrl(item.code)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 hover:underline"
              >
                Abrir
              </a>
              <button
                onClick={() => copyLink(item.code)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50"
              >
                {copied === item.code ? 'Copiado!' : 'Copiar link'}
              </button>
              <button
                onClick={() => copyMessage(item)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50"
              >
                {copiedMessage === item.code
                  ? 'Copiado!'
                  : 'Copiar mensagem'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 text-sm"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            {data.page} de {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 text-sm"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
