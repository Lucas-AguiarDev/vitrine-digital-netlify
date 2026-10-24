'use client'

import { useState, useMemo } from 'react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  sizes: string[]
  colors: string[]
  image_url: string | null
  featured: boolean
  sort_order: number
}

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  whatsapp: string
  accent_color: string
  banner_message: string | null
  banner_image_url: string | null
  logo_url: string | null
  plan: string
}

interface CartItem {
  product: Product
  size: string
  color: string
  qty: number
}

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function whatsappLink(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/55${clean}?text=${encodeURIComponent(message)}`
}

interface CustomerInfo {
  name: string
  contact: string
  address: string
}

function buildOrderMessage(store: Store, cart: CartItem[], customer?: CustomerInfo) {
  const lines = cart.map(item => {
    const extras = [item.size && `Tamanho: ${item.size}`, item.color && `Cor: ${item.color}`].filter(Boolean).join(' | ')
    return `• ${item.qty}x ${item.product.name}${extras ? ` (${extras})` : ''} — ${formatPrice(item.product.price * item.qty)}`
  })
  const total = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  let msg = `Olá! Gostaria de fazer um pedido na *${store.name}*:\n\n${lines.join('\n')}\n\n*Total: ${formatPrice(total)}*`
  if (customer?.name || customer?.contact || customer?.address) {
    msg += '\n\n*Dados do pedido:*'
    if (customer.name) msg += `\nNome: ${customer.name}`
    if (customer.contact) msg += `\nContato: ${customer.contact}`
    if (customer.address) msg += `\nEndereço: ${customer.address}`
  }
  return msg
}

export default function LojaClient({ store, products }: { store: Store; products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', contact: '', address: '' })

  const accent = store.accent_color || '#C9376E'

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)))
    return ['Todos', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    if (selectedCategory === 'Todos') return products
    return products.filter(p => p.category === selectedCategory)
  }, [products, selectedCategory])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)

  function addToCart(product: Product, size: string, color: string) {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id && i.size === size && i.color === color)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, { product, size, color, qty: 1 }]
    })
    setSelectedProduct(null)
    setCartOpen(true)
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  const orderLink = whatsappLink(store.whatsapp, buildOrderMessage(store, cart, customer))

  return (
    <div style={{ '--accent': accent } as React.CSSProperties} className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.name} className="h-9 w-9 rounded-lg object-cover" />
            )}
            <span className="font-bold text-lg text-neutral-900 dark:text-white">{store.name}</span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            🛒 Carrinho
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner */}
      {(store.banner_image_url || store.banner_message) && (
        <div
          className="relative w-full flex items-center justify-center text-center py-10 px-4"
          style={{
            background: store.banner_image_url
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${store.banner_image_url}) center/cover`
              : accent,
            minHeight: 140,
          }}
        >
          {store.banner_message && (
            <p className="text-white text-xl font-bold max-w-xl drop-shadow">{store.banner_message}</p>
          )}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Categorias */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={selectedCategory === cat
                  ? { backgroundColor: accent, color: '#fff', borderColor: accent }
                  : { backgroundColor: 'transparent', color: '#666', borderColor: '#ddd' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de produtos */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">Nenhum produto disponível.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <button
                key={product.id}
                onClick={() => { setSelectedProduct(product); setSelectedSize(''); setSelectedColor('') }}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden text-left hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-neutral-100 dark:bg-neutral-800">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  }
                </div>
                <div className="p-3">
                  {product.featured && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full mb-1 inline-block"
                      style={{ backgroundColor: accent + '20', color: accent }}>
                      Destaque
                    </span>
                  )}
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-2">{product.name}</p>
                  <p className="text-base font-bold mt-1" style={{ color: accent }}>{formatPrice(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modal produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {selectedProduct.image_url && (
              <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-52 object-cover rounded-xl mb-4" />
            )}
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedProduct.name}</h2>
            {selectedProduct.description && (
              <p className="text-sm text-neutral-500 mt-1">{selectedProduct.description}</p>
            )}
            <p className="text-2xl font-bold mt-2" style={{ color: accent }}>{formatPrice(selectedProduct.price)}</p>

            {selectedProduct.sizes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-neutral-500 mb-2">TAMANHO</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className="px-3 py-1 rounded-lg border text-sm font-medium transition-colors"
                      style={selectedSize === s ? { backgroundColor: accent, color: '#fff', borderColor: accent } : {}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.colors.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-neutral-500 mb-2">COR</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct.colors.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className="px-3 py-1 rounded-lg border text-sm font-medium transition-colors"
                      style={selectedColor === c ? { backgroundColor: accent, color: '#fff', borderColor: accent } : {}}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => addToCart(selectedProduct, selectedSize, selectedColor)}
              disabled={
                (selectedProduct.sizes.length > 0 && !selectedSize) ||
                (selectedProduct.colors.length > 0 && !selectedColor)
              }
              className="w-full mt-6 py-3 rounded-xl text-white font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      )}

      {/* Carrinho */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setCartOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Carrinho</h2>
              <button onClick={() => setCartOpen(false)} className="text-neutral-400 text-2xl leading-none">&times;</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">Carrinho vazio</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                        {item.product.image_url
                          ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{item.product.name}</p>
                        {(item.size || item.color) && (
                          <p className="text-xs text-neutral-400">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                        )}
                        <p className="text-sm font-bold" style={{ color: accent }}>{formatPrice(item.product.price * item.qty)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-neutral-500">×{item.qty}</span>
                        <button onClick={() => removeFromCart(idx)} className="text-red-400 text-xs ml-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mb-4">
                  <div className="flex justify-between text-lg font-bold text-neutral-900 dark:text-white">
                    <span>Total</span>
                    <span style={{ color: accent }}>{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                {/* Dados do cliente */}
                <div className="mb-5 space-y-3">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Seus dados</p>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Nome *</label>
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={customer.name}
                      onChange={e => setCustomer(s => ({ ...s, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accent } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">WhatsApp / Telefone *</label>
                    <input
                      type="tel"
                      placeholder="(51) 99999-9999"
                      value={customer.contact}
                      onChange={e => setCustomer(s => ({ ...s, contact: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accent } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Endereço de entrega</label>
                    <textarea
                      placeholder="Rua, número, bairro, cidade..."
                      value={customer.address}
                      onChange={e => setCustomer(s => ({ ...s, address: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 resize-none"
                      style={{ '--tw-ring-color': accent } as React.CSSProperties}
                    />
                  </div>
                </div>

                <a
                  href={customer.name && customer.contact ? orderLink : undefined}
                  onClick={e => { if (!customer.name || !customer.contact) e.preventDefault() }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold transition-opacity ${!customer.name || !customer.contact ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {customer.name && customer.contact ? 'Finalizar via WhatsApp' : 'Preencha nome e contato'}
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400">
        Powered by Vitrine Digital · MVA Estúdio Criativo
      </footer>
    </div>
  )
}
