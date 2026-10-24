'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  slug: string
  whatsapp: string
  plan: 'starter' | 'pro' | 'premium'
  active: boolean
  created_at: string
  profiles: { id: string; full_name: string; email: string } | null
}

interface Stats {
  total_stores: number
  active_stores: number
  total_orders: number
  monthly_signups: Record<string, number>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToken(): string | null {
  try { return localStorage.getItem('sb_token') } catch { return null }
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken()
  return fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  })
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()

    if (res.ok && json.token) {
      try { localStorage.setItem('sb_token', json.token) } catch {}
      onLogin()
    } else {
      setError(json.error ?? 'Credenciais inválidas')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 rounded-xl mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">MVA Admin</h1>
          <p className="text-neutral-400 text-sm mt-1">Painel de controle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
              placeholder="lucas@mvaestudio.com.br"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── New Client Modal ─────────────────────────────────────────────────────────

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    store_name: '',
    store_slug: '',
    whatsapp: '',
    plan: 'starter' as const,
    setup_fee_paid: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ store_url: string; admin_url: string } | null>(null)

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function handleChange(field: string, value: string | boolean) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'store_name' && typeof value === 'string') {
        next.store_slug = autoSlug(value)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await apiFetch('/api/superadmin/clients', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    const json = await res.json()

    if (res.ok) {
      setResult({ store_url: json.client.store_url, admin_url: json.client.admin_url })
      onCreated()
    } else {
      setError(json.error ?? 'Erro ao criar cliente')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="font-semibold text-white">Novo cliente</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {result ? (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-1">Cliente criado!</h3>
            <p className="text-neutral-400 text-sm mb-6">E-mail de redefinição de senha foi enviado automaticamente.</p>

            <div className="space-y-3 text-left">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Link da vitrine pública</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={result.store_url}
                    className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard?.writeText(result.store_url).catch(() => {})}
                    className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Link do painel do cliente</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={result.admin_url}
                    className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard?.writeText(result.admin_url).catch(() => {})}
                    className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg py-2.5 text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nome do responsável *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required
                  placeholder="Maria Silva"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  required
                  placeholder="maria@loja.com"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nome da loja *</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={e => handleChange('store_name', e.target.value)}
                  required
                  placeholder="Maria Fashion"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Slug (URL)
                  <span className="text-neutral-500 font-normal ml-1">/loja/<span className="text-amber-400">{form.store_slug || '…'}</span></span>
                </label>
                <input
                  type="text"
                  value={form.store_slug}
                  onChange={e => handleChange('store_slug', autoSlug(e.target.value))}
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="maria-fashion"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">WhatsApp *</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => handleChange('whatsapp', e.target.value)}
                  required
                  placeholder="51999999999"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Plano *</label>
                <select
                  value={form.plan}
                  onChange={e => handleChange('plan', e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="starter">Starter — R$ 97/mês</option>
                  <option value="pro">Pro — R$ 147/mês</option>
                  <option value="premium">Premium — R$ 197/mês</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.setup_fee_paid}
                onChange={e => handleChange('setup_fee_paid', e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm text-neutral-300">Setup de R$ 1.200 já foi pago</span>
            </label>

            {error && (
              <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg py-2.5 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg py-2.5 text-sm transition-colors"
              >
                {loading ? 'Criando…' : 'Criar cliente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'bg-blue-500/20 text-blue-300' },
  pro: { label: 'Pro', color: 'bg-violet-500/20 text-violet-300' },
  premium: { label: 'Premium', color: 'bg-amber-500/20 text-amber-300' },
}

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterActive, setFilterActive] = useState('all')
  const [toggling, setToggling] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [clientsRes, statsRes] = await Promise.all([
      apiFetch('/api/superadmin/clients'),
      apiFetch('/api/superadmin/stats'),
    ])

    if (clientsRes.ok) {
      const json = await clientsRes.json()
      setClients(json.clients ?? [])
    }
    if (statsRes.ok) {
      const json = await statsRes.json()
      setStats(json)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) loadData()
  }, [authed, loadData])

  async function toggleActive(client: Client) {
    setToggling(client.id)
    await apiFetch(`/api/superadmin/clients/${client.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !client.active }),
    })
    setClients(prev => prev.map(c =>
      c.id === client.id ? { ...c, active: !c.active } : c
    ))
    setToggling(null)
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.profiles?.full_name?.toLowerCase().includes(q) ||
      c.profiles?.email?.toLowerCase().includes(q)
    const matchPlan = filterPlan === 'all' || c.plan === filterPlan
    const matchActive = filterActive === 'all' ||
      (filterActive === 'active' && c.active) ||
      (filterActive === 'inactive' && !c.active)
    return matchSearch && matchPlan && matchActive
  })

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-sm">MVA Superadmin</span>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo cliente
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total de lojas', value: stats.total_stores, icon: '🏪' },
              { label: 'Lojas ativas', value: stats.active_stores, icon: '✅' },
              { label: 'Inativas', value: stats.total_stores - stats.active_stores, icon: '⏸' },
              { label: 'Pedidos', value: stats.total_orders, icon: '📦' },
            ].map(stat => (
              <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, slug ou e-mail…"
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-neutral-500"
            />
          </div>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos os planos</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Ativas + inativas</option>
            <option value="active">Só ativas</option>
            <option value="inactive">Só inativas</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '…' : '↻'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-neutral-500">
              {loading ? 'Carregando…' : clients.length === 0 ? 'Nenhum cliente ainda. Clique em "Novo cliente" para começar.' : 'Nenhum resultado para esse filtro.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left text-xs font-medium text-neutral-400 px-4 py-3">Cliente</th>
                    <th className="text-left text-xs font-medium text-neutral-400 px-4 py-3">Loja / Slug</th>
                    <th className="text-left text-xs font-medium text-neutral-400 px-4 py-3">Plano</th>
                    <th className="text-left text-xs font-medium text-neutral-400 px-4 py-3">Desde</th>
                    <th className="text-left text-xs font-medium text-neutral-400 px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-neutral-400 px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filtered.map(client => {
                    const plan = PLAN_LABELS[client.plan] ?? { label: client.plan, color: 'bg-neutral-700 text-neutral-300' }
                    const date = new Date(client.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                    return (
                      <tr key={client.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{client.profiles?.full_name ?? '—'}</p>
                          <p className="text-neutral-400 text-xs mt-0.5">{client.profiles?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white">{client.name}</p>
                          <a
                            href={`/loja/${client.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 text-xs hover:underline mt-0.5 inline-block"
                          >
                            /loja/{client.slug} ↗
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${plan.color}`}>
                            {plan.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-xs">{date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${client.active ? 'text-green-400' : 'text-neutral-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${client.active ? 'bg-green-400' : 'bg-neutral-500'}`} />
                            {client.active ? 'Ativa' : 'Suspensa'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggleActive(client)}
                            disabled={toggling === client.id}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                              client.active
                                ? 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800'
                                : 'bg-green-950 hover:bg-green-900 text-green-400 border border-green-800'
                            }`}
                          >
                            {toggling === client.id ? '…' : client.active ? 'Suspender' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-neutral-500 mt-3 text-right">
            {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'} exibido{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>

      {showNewModal && (
        <NewClientModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => loadData()}
        />
      )}
    </div>
  )
}
