'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Store, Product } from '@/types'

type Tab = 'produtos' | 'loja' | 'vitrine' | 'senha'

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
  const [storeForm, setStoreForm] = useState({ name: '', description: '', whatsapp: '', accent_color: '#7c3aed', banner_message: '' })
  const [savingStore, setSavingStore] = useState(false)
  const [storeMsg, setStoreMsg] = useState('')

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
        console.error('[upload]', json)
      }
    } catch (err) {
      alert('❌ Erro de conexão ao fazer upload')
      console.error('[upload]', err)
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

  // ── Loja ──────────────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-gray-400">Carregando...</div>
    </main>
  )

  if (error) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-red-400">{error}</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛍️</span>
          <div>
            <div className="font-semibold text-sm">{store?.name}</div>
            <div className="text-xs text-gray-500">Painel da loja</div>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-white transition-colors">
          Sair
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['produtos', 'loja', 'vitrine', 'senha'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'vitrine' ? '🔗 Vitrine' : t === 'loja' ? '⚙️ Config' : t === 'senha' ? '🔑 Senha' : '📦 Produtos'}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4">

        {/* ── TAB PRODUTOS ── */}
        {tab === 'produtos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{products.length} produto{products.length !== 1 ? 's' : ''}</h2>
              <button
                onClick={openNewProduct}
                className="bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Novo produto
              </button>
            </div>

            {products.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <div className="text-4xl mb-3">📦</div>
                <div>Nenhum produto cadastrado ainda.</div>
                <button onClick={openNewProduct} className="mt-4 text-purple-400 hover:underline text-sm">
                  Adicionar o primeiro produto
                </button>
              </div>
            )}

            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className={`flex items-center gap-3 bg-gray-900 rounded-xl p-3 border ${p.active ? 'border-gray-800' : 'border-gray-800/40 opacity-60'}`}>
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-lg" /> : '👗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      R$ {p.price.toFixed(2).replace('.', ',')} · {p.category}
                      {p.featured && <span className="ml-2 text-yellow-500">⭐ Destaque</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleProduct(p)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${p.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                      {p.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => openEditProduct(p)} className="text-gray-500 hover:text-white text-sm">✏️</button>
                    <button onClick={() => deleteProduct(p)} className="text-gray-500 hover:text-red-400 text-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB CONFIGURAÇÕES ── */}
        {tab === 'loja' && (
          <form onSubmit={saveStore} className="space-y-4 max-w-lg">
            <h2 className="font-semibold">Configurações da loja</h2>

            {storeMsg && (
              <div className={`text-sm px-3 py-2 rounded-lg ${storeMsg.includes('sucesso') ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                {storeMsg}
              </div>
            )}

            <Field label="Nome da loja">
              <input type="text" value={storeForm.name} onChange={e => setStoreForm(s => ({ ...s, name: e.target.value }))}
                className="input" required />
            </Field>

            <Field label="Descrição">
              <textarea value={storeForm.description} onChange={e => setStoreForm(s => ({ ...s, description: e.target.value }))}
                rows={2} className="input resize-none" />
            </Field>

            <Field label="WhatsApp (com DDD, só números)">
              <input type="tel" value={storeForm.whatsapp} onChange={e => setStoreForm(s => ({ ...s, whatsapp: e.target.value }))}
                placeholder="51999999999" className="input" />
            </Field>

            <Field label="Cor de destaque">
              <div className="flex items-center gap-3">
                <input type="color" value={storeForm.accent_color} onChange={e => setStoreForm(s => ({ ...s, accent_color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-gray-400 text-sm">{storeForm.accent_color}</span>
              </div>
            </Field>

            <Field label="Mensagem do banner (opcional)">
              <input type="text" value={storeForm.banner_message} onChange={e => setStoreForm(s => ({ ...s, banner_message: e.target.value }))}
                placeholder="Ex: Frete grátis acima de R$ 200" className="input" />
            </Field>

            <button type="submit" disabled={savingStore}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors px-6 py-2 rounded-lg text-sm font-medium">
              {savingStore ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        )}

        {/* ── TAB SENHA ── */}
        {tab === 'senha' && (
          <form onSubmit={saveSenha} className="space-y-4 max-w-sm">
            <h2 className="font-semibold">Alterar senha</h2>

            {senhaMsg && (
              <div className={`text-sm px-3 py-2 rounded-lg ${senhaMsg.includes('sucesso') ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                {senhaMsg}
              </div>
            )}

            <Field label="Nova senha (mínimo 8 caracteres)">
              <input type="password" value={senhaForm.new_password}
                onChange={e => setSenhaForm(s => ({ ...s, new_password: e.target.value }))}
                minLength={8} required className="input" placeholder="••••••••" />
            </Field>

            <Field label="Confirmar nova senha">
              <input type="password" value={senhaForm.confirm}
                onChange={e => setSenhaForm(s => ({ ...s, confirm: e.target.value }))}
                minLength={8} required className="input" placeholder="••••••••" />
            </Field>

            <button type="submit" disabled={savingSenha}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors px-6 py-2 rounded-lg text-sm font-medium">
              {savingSenha ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>
        )}

        {/* ── TAB VITRINE ── */}
        {tab === 'vitrine' && store && (
          <div className="space-y-4 max-w-lg">
            <h2 className="font-semibold">Sua vitrine pública</h2>
            <div className="bg-gray-900 rounded-xl p-4 space-y-3 border border-gray-800">
              <div>
                <div className="text-xs text-gray-500 mb-1">Link da vitrine</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-800 px-3 py-2 rounded-lg text-sm text-purple-300 break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/loja/{store.slug}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/loja/${store.slug}`)}
                    className="bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-2 rounded-lg text-sm"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Compartilhe esse link com seus clientes. Eles podem navegar pelos produtos e fazer pedidos pelo WhatsApp.
              </div>
              <a
                href={`/loja/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
              >
                Abrir vitrine →
              </a>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-2">
              <div className="text-sm font-medium">Status</div>
              <div className={`text-sm ${store.active ? 'text-green-400' : 'text-red-400'}`}>
                {store.active ? '✅ Vitrine ativa' : '❌ Vitrine inativa'}
              </div>
              <div className="text-xs text-gray-500">Plano: <span className="capitalize text-white">{store.plan}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Produto ── */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold">{editingProduct ? 'Editar produto' : 'Novo produto'}</h3>
              <button onClick={() => setShowProductForm(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <Field label="Nome *">
                <input type="text" value={productForm.name} onChange={e => setProductForm(s => ({ ...s, name: e.target.value }))}
                  className="input" placeholder="Nome do produto" />
              </Field>
              <Field label="Preço (R$) *">
                <input type="number" step="0.01" min="0" value={productForm.price}
                  onChange={e => setProductForm(s => ({ ...s, price: e.target.value }))}
                  className="input" placeholder="0,00" />
              </Field>
              <Field label="Categoria">
                <select value={productForm.category} onChange={e => setProductForm(s => ({ ...s, category: e.target.value }))}
                  className="input">
                  {['Roupas', 'Calçados', 'Acessórios', 'Bolsas', 'Lingerie', 'Infantil', 'Geral'].map(c =>
                    <option key={c}>{c}</option>
                  )}
                </select>
              </Field>
              <Field label="Descrição">
                <textarea value={productForm.description} onChange={e => setProductForm(s => ({ ...s, description: e.target.value }))}
                  rows={2} className="input resize-none" placeholder="Descreva o produto..." />
              </Field>
              <Field label="Tamanhos (separados por vírgula)">
                <input type="text" value={productForm.sizes} onChange={e => setProductForm(s => ({ ...s, sizes: e.target.value }))}
                  className="input" placeholder="P, M, G, GG" />
              </Field>
              <Field label="Cores (separadas por vírgula)">
                <input type="text" value={productForm.colors} onChange={e => setProductForm(s => ({ ...s, colors: e.target.value }))}
                  className="input" placeholder="Preto, Branco, Azul" />
              </Field>
              <Field label="Imagem do produto">
                <div className="space-y-2">
                  {productForm.image_url && (
                    <div className="relative w-24 h-24">
                      <img src={productForm.image_url} alt="" className="w-24 h-24 object-cover rounded-lg" />
                      <button type="button" onClick={() => setProductForm(s => ({ ...s, image_url: '' }))}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        ✕
                      </button>
                    </div>
                  )}
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-600 cursor-pointer hover:border-purple-500 transition-colors text-sm text-gray-400 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                    {uploadingImage ? '⏳ Enviando...' : '📷 Selecionar imagem (JPG/PNG/WEBP, máx 5MB)'}
                  </label>
                </div>
              </Field>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={productForm.active} onChange={e => setProductForm(s => ({ ...s, active: e.target.checked }))}
                    className="w-4 h-4" />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={productForm.featured} onChange={e => setProductForm(s => ({ ...s, featured: e.target.checked }))}
                    className="w-4 h-4" />
                  Destaque ⭐
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowProductForm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 transition-colors py-2 rounded-lg text-sm">
                Cancelar
              </button>
              <button onClick={saveProduct} disabled={saving || !productForm.name || !productForm.price}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors py-2 rounded-lg text-sm font-medium">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #7c3aed; }
        .input option { background: #1f2937; }
      `}</style>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      {children}
    </div>
  )
}
