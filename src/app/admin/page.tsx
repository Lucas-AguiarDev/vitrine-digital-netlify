'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Store, Product } from '@/types'

type Tab = 'produtos' | 'loja' | 'vitrine' | 'senha'

// ─── Icons ────────────────────────────────────────────────────────────────────
function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

const ICONS = {
  store:   'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  product: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  link:    'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  key:     'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  plus:    'M12 4v16m8-8H4',
  edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  logout:  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  image:   'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  copy:    'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  external:'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  check:   'M5 13l4 4L19 7',
  star:    'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-violet-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [tab, setTab] = useState<Tab>('produtos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Produto form ──────────────────────────────────────────────────────────
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: 'Roupas',
    sizes: '', colors: '', active: true, featured: false, image_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // ── Senha form ────────────────────────────────────────────────────────────
  const [senhaForm, setSenhaForm] = useState({ new_password: '', confirm: '' })
  const [savingSenha, setSavingSenha] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState('')

  // ── Loja form ─────────────────────────────────────────────────────────────
  const [storeForm, setStoreForm] = useState({
    name: '', description: '', whatsapp: '', accent_color: '#7c3aed', banner_message: ''
  })
  const [savingStore, setSavingStore] = useState(false)
  const [storeMsg, setStoreMsg] = useState('')

  // ── Copy feedback ─────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)

  const authHeaders = useCallback((t: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${t}`,
  }), [])

  const loadData = useCallback(async (t: string) => {
    try {
      const [storeRes, productsRes] = await Promise.all([
        fetch('/api/admin/store', { headers: authHeaders(t) }),
        fetch('/api/admin/products', { headers: authHeaders(t) }),
      ])
      if (storeRes.status === 401) {
        localStorage.removeItem('store_token')
        router.replace('/login')
        return
      }
      const storeJson = await storeRes.json()
      const productsJson = await productsRes.json()
      if (storeJson.data) {
        setStore(storeJson.data)
        setStoreForm({
          name: storeJson.data.name || '',
          description: storeJson.data.description || '',
          whatsapp: storeJson.data.whatsapp || '',
          accent_color: storeJson.data.accent_color || '#7c3aed',
          banner_message: storeJson.data.banner_message || '',
        })
      }
      if (productsJson.data) setProducts(productsJson.data)
    } catch {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, router])

  useEffect(() => {
    const t = localStorage.getItem('store_token')
    if (!t) { router.replace('/login'); return }
    setToken(t)
    loadData(t)
  }, [loadData, router])

  function logout() {
    localStorage.removeItem('store_token')
    router.replace('/login')
  }

  // ── Produto ───────────────────────────────────────────────────────────────
  function openNewProduct() {
    setEditingProduct(null)
    setProductForm({ name: '', description: '', price: '', category: 'Roupas', sizes: '', colors: '', active: true, featured: false, image_url: '' })
    setShowProductForm(true)
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      category: p.category,
      sizes: p.sizes.join(', '),
      colors: p.colors.join(', '),
      active: p.active,
      featured: p.featured,
      image_url: p.image_url || '',
    })
    setShowProductForm(true)
  }

  async function handleImageUpload(file: File) {
    if (!token) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json()
      if (json.data?.url) {
        setProductForm(s => ({ ...s, image_url: json.data.url }))
      } else {
        const msg = json.error?.message || 'Erro ao fazer upload'
        alert(`❌ ${msg}`)
      }
    } catch {
      alert('❌ Erro de conexão ao fazer upload')
    } finally {
      setUploadingImage(false)
    }
  }

  async function saveSenha(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (senhaForm.new_password !== senhaForm.confirm) {
      setSenhaMsg('As senhas não coincidem.')
      return
    }
    setSavingSenha(true)
    setSenhaMsg('')
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ new_password: senhaForm.new_password }),
      })
      const json = await res.json()
      if (json.data?.updated) {
        setSenhaMsg('Senha alterada com sucesso!')
        setSenhaForm({ new_password: '', confirm: '' })
      } else {
        setSenhaMsg(json.error?.message || 'Erro ao alterar senha.')
      }
    } finally {
      setSavingSenha(false)
      setTimeout(() => setSenhaMsg(''), 4000)
    }
  }

  async function saveProduct() {
    if (!token || !productForm.name || !productForm.price) return
    setSaving(true)
    try {
      const body = {
        name: productForm.name,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        category: productForm.category,
        sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: productForm.colors.split(',').map(s => s.trim()).filter(Boolean),
        active: productForm.active,
        featured: productForm.featured,
        image_url: productForm.image_url || null,
      }
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(body) })
      const json = await res.json()
      if (json.data) {
        if (editingProduct) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? json.data : p))
        } else {
          setProducts(prev => [json.data, ...prev])
        }
        setShowProductForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleProduct(p: Product) {
    if (!token) return
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ active: !p.active }),
    })
    const json = await res.json()
    if (json.data) setProducts(prev => prev.map(x => x.id === p.id ? json.data : x))
  }

  async function deleteProduct(p: Product) {
    if (!token || !confirm(`Deletar "${p.name}"?`)) return
    await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE', headers: authHeaders(token) })
    setProducts(prev => prev.filter(x => x.id !== p.id))
  }

  async function saveStore(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSavingStore(true)
    setStoreMsg('')
    try {
      const res = await fetch('/api/admin/store', {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(storeForm),
      })
      const json = await res.json()
      if (json.data) { setStore(json.data); setStoreMsg('Salvo com sucesso!') }
      else setStoreMsg('Erro ao salvar.')
    } finally {
      setSavingStore(false)
      setTimeout(() => setStoreMsg(''), 3000)
    }
  }

  function copyLink() {
    const link = `${window.location.origin}/loja/${store?.slug}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeProducts = products.filter(p => p.active).length
  const featuredProducts = products.filter(p => p.featured).length

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Carregando painel…</p>
      </div>
    </main>
  )

  if (error) return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => { const t = localStorage.getItem('store_token'); if (t) { setLoading(true); setError(''); loadData(t) } }}
          className="text-sm text-violet-400 hover:underline">Tentar novamente</button>
      </div>
    </main>
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'produtos', label: 'Produtos', icon: ICONS.product },
    { id: 'loja',     label: 'Config',   icon: ICONS.store },
    { id: 'vitrine',  label: 'Vitrine',  icon: ICONS.link },
    { id: 'senha',    label: 'Senha',    icon: ICONS.key },
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Swatch with store accent */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: store?.accent_color || '#7c3aed' }}
            >
              <Icon path={ICONS.store} className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-none">{store?.name}</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Painel da loja</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
          >
            <Icon path={ICONS.logout} className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-semibold transition-colors relative whitespace-nowrap ${
                  tab === t.id
                    ? 'text-violet-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon path={t.icon} className="w-3.5 h-3.5" />
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ══ TAB PRODUTOS ══════════════════════════════════════════════════ */}
        {tab === 'produtos' && (
          <div className="space-y-6">

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total" value={products.length} />
              <StatCard label="Ativos" value={activeProducts} sub={products.length > 0 ? `${Math.round(activeProducts / products.length * 100)}% do catálogo` : undefined} />
              <StatCard label="Destaques" value={featuredProducts} />
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">
                {products.length === 0 ? 'Catálogo vazio' : `${products.length} produto${products.length !== 1 ? 's' : ''}`}
              </h2>
              <button
                onClick={openNewProduct}
                className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Icon path={ICONS.plus} className="w-4 h-4" />
                Novo produto
              </button>
            </div>

            {/* Empty state */}
            {products.length === 0 && (
              <div className="border border-dashed border-slate-700 rounded-2xl py-20 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon path={ICONS.product} className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">Nenhum produto ainda</p>
                <p className="text-slate-600 text-sm mt-1">Adicione o primeiro produto ao catálogo.</p>
                <button
                  onClick={openNewProduct}
                  className="mt-5 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  <Icon path={ICONS.plus} className="w-4 h-4" />
                  Adicionar produto
                </button>
              </div>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div
                  key={p.id}
                  className={`group relative bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                    p.active ? 'border-slate-700/60 hover:border-slate-600' : 'border-slate-800/40 opacity-50'
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-slate-800 relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon path={ICONS.image} className="w-12 h-12 text-slate-600" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {p.featured && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          <Icon path={ICONS.star} className="w-2.5 h-2.5" />
                          Destaque
                        </span>
                      )}
                      {!p.active && (
                        <span className="bg-slate-900/80 backdrop-blur-sm text-slate-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-lg p-2 transition-colors"
                        title="Editar"
                      >
                        <Icon path={ICONS.edit} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleProduct(p)}
                        className={`backdrop-blur-sm border rounded-lg p-2 transition-colors text-xs font-semibold px-3 ${
                          p.active
                            ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300'
                            : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-300'
                        }`}
                      >
                        {p.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => deleteProduct(p)}
                        className="bg-white/10 hover:bg-red-500/30 backdrop-blur-sm border border-white/20 hover:border-red-500/30 text-white hover:text-red-300 rounded-lg p-2 transition-colors"
                        title="Deletar"
                      >
                        <Icon path={ICONS.trash} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-sm text-white truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-violet-400 text-sm font-bold">
                        R$ {p.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs text-slate-500">{p.category}</span>
                    </div>
                    {(p.sizes.length > 0 || p.colors.length > 0) && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {p.sizes.slice(0, 4).map(s => (
                          <span key={s} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                        {p.sizes.length > 4 && <span className="text-[10px] text-slate-500">+{p.sizes.length - 4}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB CONFIG ════════════════════════════════════════════════════ */}
        {tab === 'loja' && (
          <form onSubmit={saveStore} className="max-w-lg space-y-5">
            <div>
              <h2 className="font-semibold text-slate-200">Configurações da loja</h2>
              <p className="text-xs text-slate-500 mt-0.5">Estas informações aparecem na sua vitrine pública.</p>
            </div>

            {storeMsg && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg ${
                storeMsg.includes('sucesso')
                  ? 'bg-green-900/30 text-green-300 border border-green-800/50'
                  : 'bg-red-900/30 text-red-300 border border-red-800/50'
              }`}>
                <Icon path={storeMsg.includes('sucesso') ? ICONS.check : ''} className="w-4 h-4 flex-shrink-0" />
                {storeMsg}
              </div>
            )}

            <Field label="Nome da loja">
              <input
                type="text"
                value={storeForm.name}
                onChange={e => setStoreForm(s => ({ ...s, name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder-slate-500"
                required
              />
            </Field>

            <Field label="Descrição">
              <textarea
                value={storeForm.description}
                onChange={e => setStoreForm(s => ({ ...s, description: e.target.value }))}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors resize-none placeholder-slate-500"
                placeholder="Breve descrição da loja…"
              />
            </Field>

            <Field label="WhatsApp" hint="Apenas números com DDD. Ex: 51999999999">
              <input
                type="tel"
                value={storeForm.whatsapp}
                onChange={e => setStoreForm(s => ({ ...s, whatsapp: e.target.value }))}
                placeholder="51999999999"
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder-slate-500"
              />
            </Field>

            <Field label="Cor de destaque">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={storeForm.accent_color}
                    onChange={e => setStoreForm(s => ({ ...s, accent_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0.5"
                  />
                </div>
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: storeForm.accent_color }} />
                  <span className="text-sm text-slate-300 font-mono">{storeForm.accent_color}</span>
                </div>
              </div>
            </Field>

            <Field label="Mensagem do banner" hint="Aparece em destaque no topo da vitrine.">
              <input
                type="text"
                value={storeForm.banner_message}
                onChange={e => setStoreForm(s => ({ ...s, banner_message: e.target.value }))}
                placeholder="Ex: Frete grátis acima de R$ 200 🎁"
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder-slate-500"
              />
            </Field>

            <button
              type="submit"
              disabled={savingStore}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors px-6 py-2.5 rounded-lg text-sm font-semibold"
            >
              {savingStore ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando…
                </>
              ) : 'Salvar alterações'}
            </button>
          </form>
        )}

        {/* ══ TAB SENHA ═════════════════════════════════════════════════════ */}
        {tab === 'senha' && (
          <form onSubmit={saveSenha} className="max-w-sm space-y-5">
            <div>
              <h2 className="font-semibold text-slate-200">Alterar senha</h2>
              <p className="text-xs text-slate-500 mt-0.5">Use uma senha forte com pelo menos 8 caracteres.</p>
            </div>

            {senhaMsg && (
              <div className={`text-sm px-3 py-2.5 rounded-lg border ${
                senhaMsg.includes('sucesso')
                  ? 'bg-green-900/30 text-green-300 border-green-800/50'
                  : 'bg-red-900/30 text-red-300 border-red-800/50'
              }`}>
                {senhaMsg}
              </div>
            )}

            <Field label="Nova senha">
              <input
                type="password"
                value={senhaForm.new_password}
                onChange={e => setSenhaForm(s => ({ ...s, new_password: e.target.value }))}
                minLength={8} required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder-slate-500"
              />
            </Field>

            <Field label="Confirmar nova senha">
              <input
                type="password"
                value={senhaForm.confirm}
                onChange={e => setSenhaForm(s => ({ ...s, confirm: e.target.value }))}
                minLength={8} required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder-slate-500"
              />
            </Field>

            <button
              type="submit"
              disabled={savingSenha}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors px-6 py-2.5 rounded-lg text-sm font-semibold"
            >
              {savingSenha ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando…
                </>
              ) : 'Alterar senha'}
            </button>
          </form>
        )}

        {/* ══ TAB VITRINE ═══════════════════════════════════════════════════ */}
        {tab === 'vitrine' && store && (
          <div className="max-w-lg space-y-5">
            <div>
              <h2 className="font-semibold text-slate-200">Sua vitrine pública</h2>
              <p className="text-xs text-slate-500 mt-0.5">Compartilhe este link com seus clientes.</p>
            </div>

            {/* Link card */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: store.active ? '#34d399' : '#94a3b8' }}
                />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {store.active ? 'Vitrine ativa' : 'Vitrine inativa'}
                </span>
                <span className="ml-auto text-xs text-slate-500 capitalize">
                  Plano {store.plan}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-violet-300 font-mono break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/loja/{store.slug}
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <Icon path={copied ? ICONS.check : ICONS.copy} className="w-3.5 h-3.5" />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <a
                  href={`/loja/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Icon path={ICONS.external} className="w-3.5 h-3.5" />
                  Abrir vitrine em nova aba
                </a>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Produtos" value={products.length} />
              <StatCard label="Ativos" value={activeProducts} />
              <StatCard label="Destaques" value={featuredProducts} />
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Produto ───────────────────────────────────────────────────── */}
      {showProductForm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowProductForm(false) }}
        >
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-white">{editingProduct ? 'Editar produto' : 'Novo produto'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingProduct ? `Editando "${editingProduct.name}"` : 'Preencha os dados do produto'}</p>
              </div>
              <button
                onClick={() => setShowProductForm(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Image upload area */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Imagem</label>
                <div className="relative">
                  {productForm.image_url ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-800">
                      <img src={productForm.image_url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProductForm(s => ({ ...s, image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg w-7 h-7 flex items-center justify-center text-sm transition-colors"
                      >
                        ✕
                      </button>
                      <label className={`absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Icon path={ICONS.image} className="w-3.5 h-3.5" />
                        {uploadingImage ? 'Enviando…' : 'Trocar'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                      </label>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl aspect-video cursor-pointer transition-colors ${
                      uploadingImage
                        ? 'border-violet-500 bg-violet-500/5 pointer-events-none'
                        : 'border-slate-700 hover:border-violet-500 bg-slate-800/50 hover:bg-violet-500/5'
                    }`}>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                      {uploadingImage ? (
                        <>
                          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-violet-400">Enviando imagem…</span>
                        </>
                      ) : (
                        <>
                          <Icon path={ICONS.image} className="w-8 h-8 text-slate-500" />
                          <div className="text-center">
                            <p className="text-xs text-slate-400">Clique para selecionar</p>
                            <p className="text-xs text-slate-600 mt-0.5">JPG, PNG ou WEBP · máx 5 MB</p>
                          </div>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Name + Price row */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome *">
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={e => setProductForm(s => ({ ...s, name: e.target.value }))}
                    placeholder="Nome do produto"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-500"
                  />
                </Field>
                <Field label="Preço (R$) *">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={e => setProductForm(s => ({ ...s, price: e.target.value }))}
                    placeholder="0,00"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-500"
                  />
                </Field>
              </div>

              <Field label="Categoria">
                <select
                  value={productForm.category}
                  onChange={e => setProductForm(s => ({ ...s, category: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
                >
                  {['Roupas', 'Calçados', 'Acessórios', 'Bolsas', 'Lingerie', 'Infantil', 'Geral'].map(c =>
                    <option key={c} className="bg-slate-800">{c}</option>
                  )}
                </select>
              </Field>

              <Field label="Descrição">
                <textarea
                  value={productForm.description}
                  onChange={e => setProductForm(s => ({ ...s, description: e.target.value }))}
                  rows={2}
                  placeholder="Descreva o produto…"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors resize-none placeholder-slate-500"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tamanhos" hint="Separados por vírgula">
                  <input
                    type="text"
                    value={productForm.sizes}
                    onChange={e => setProductForm(s => ({ ...s, sizes: e.target.value }))}
                    placeholder="P, M, G, GG"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-500"
                  />
                </Field>
                <Field label="Cores" hint="Separadas por vírgula">
                  <input
                    type="text"
                    value={productForm.colors}
                    onChange={e => setProductForm(s => ({ ...s, colors: e.target.value }))}
                    placeholder="Preto, Branco"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-500"
                  />
                </Field>
              </div>

              {/* Toggles */}
              <div className="flex gap-3">
                {[
                  { key: 'active', label: 'Produto ativo' },
                  { key: 'featured', label: '⭐ Destaque' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProductForm(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      productForm[key as 'active' | 'featured']
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      productForm[key as 'active' | 'featured']
                        ? 'bg-violet-500 border-violet-500'
                        : 'border-slate-600'
                    }`}>
                      {productForm[key as 'active' | 'featured'] && (
                        <Icon path={ICONS.check} className="w-3 h-3 text-white" />
                      )}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 border-t border-slate-800 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowProductForm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 transition-colors py-2.5 rounded-lg text-sm font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={saveProduct}
                disabled={saving || !productForm.name || !productForm.price}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-colors py-2.5 rounded-lg text-sm font-semibold"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando…
                  </>
                ) : editingProduct ? 'Salvar alterações' : 'Adicionar produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
