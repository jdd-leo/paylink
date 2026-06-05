import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth, type UserPlan } from '../auth';

interface RecentLink {
  id: string;
  code: string;
  title: string;
  amount: string | null;
  expiresAt: string;
  createdAt: string;
}

interface Stats {
  totalLinks: number;
  activeLinks: number;
  expiredLinks: number;
  last7Days: number;
  pixKeysCount: number;
  activeValue: string | number;
  avgTicket: string | number;
  recent: RecentLink[];
}

interface AdminStats {
  totalUsers: number;
  totalLinks: number;
  plans: Record<UserPlan, number>;
}

const PLAN_LABELS: Record<UserPlan, string> = {
  FREE: 'Free',
  CREATOR: 'Creator',
  PRO: 'Pro',
};

function currency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5">
      <p className="text-xs sm:text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg sm:text-2xl font-bold text-slate-900">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-400 hidden sm:block">{hint}</p>
      )}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests: [Promise<Stats>, Promise<AdminStats> | null] = [
      api.get<Stats>('/links/stats').then((r) => r.data),
      user?.role === 'ROOT'
        ? api.get<AdminStats>('/users/stats').then((r) => r.data)
        : null,
    ];

    Promise.all([requests[0], requests[1] ?? Promise.resolve(null)])
      .then(([s, a]) => {
        setStats(s);
        setAdmin(a);
      })
      .finally(() => setLoading(false));
  }, [user?.role]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {user?.tradeName}
        </h1>
        <p className="text-sm text-slate-500">Resumo da sua conta</p>
      </div>

      {loading && <p className="text-slate-500">Carregando...</p>}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Links ativos" value={stats.activeLinks} />
            <StatCard label="Links expirados" value={stats.expiredLinks} />
            <StatCard label="Total de links" value={stats.totalLinks} />
            <StatCard label="Chaves Pix" value={stats.pixKeysCount} />
            <StatCard
              label="Valor em links ativos"
              value={currency(stats.activeValue)}
              hint="Soma dos links com valor ainda vigentes"
            />
            <StatCard
              label="Ticket médio"
              value={currency(stats.avgTicket)}
              hint="Média entre links com valor"
            />
            <StatCard
              label="Criados nos últimos 7 dias"
              value={stats.last7Days}
            />
            <StatCard
              label="Seu plano"
              value={PLAN_LABELS[user?.plan ?? 'FREE']}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/links/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              Criar link
            </Link>
            <Link
              to="/dashboard/pix"
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              Nova chave Pix
            </Link>
            <Link
              to="/dashboard/links"
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg px-4 py-2.5 text-sm"
            >
              Meus links
            </Link>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Últimos links criados
            </h2>
            {stats.recent.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">
                Nenhum link criado ainda.
              </div>
            ) : (
              <div className="grid gap-3">
                {stats.recent.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {item.title}
                        {item.amount != null && (
                          <span className="ml-2 text-emerald-600">
                            {currency(item.amount)}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        Expira em{' '}
                        {new Date(item.expiresAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <a
                      href={`${location.origin}/p/${item.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-indigo-600 hover:underline shrink-0"
                    >
                      Abrir
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && admin && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Visão da plataforma
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total de usuários" value={admin.totalUsers} />
            <StatCard label="Total de links" value={admin.totalLinks} />
            <StatCard label="Plano Free" value={admin.plans.FREE} />
            <StatCard label="Plano Creator" value={admin.plans.CREATOR} />
            <StatCard label="Plano Pro" value={admin.plans.PRO} />
          </div>
        </div>
      )}
    </div>
  );
}
