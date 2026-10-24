'use client'

import { useEffect, useState } from 'react'

const KEY = 'vitrine_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (!saved) setVisible(true)
    } catch {
      // localStorage indisponível
    }
  }, [])

  function saveConsent(analyticsOk: boolean, marketingOk: boolean) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        essential: true,
        analytics: analyticsOk,
        marketing: marketingOk,
        savedAt: new Date().toISOString(),
      }))
    } catch {}

    // Registrar no servidor (hash de IP, sem dados pessoais)
    fetch('/api/lgpd/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consent_type: 'cookies_analytics',
        granted: analyticsOk,
      }),
    }).catch(() => {})

    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              🍪 Usamos <strong>cookies essenciais</strong> para o funcionamento do sistema.
              Cookies analíticos e de marketing são opcionais e requerem seu consentimento,
              conforme a <strong>LGPD</strong>.{' '}
              <a href="/privacy" className="underline text-blue-600">Saiba mais</a>.
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Configurar
            </button>
            <button
              onClick={() => saveConsent(false, false)}
              className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Recusar opcionais
            </button>
            <button
              onClick={() => saveConsent(true, true)}
              className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
            >
              Aceitar todos
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 border-t pt-4 grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-sm">Essenciais</strong>
                <p className="text-xs text-gray-500">Autenticação e segurança. Obrigatórios.</p>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Sempre ativo</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-sm">Analíticos</strong>
                <p className="text-xs text-gray-500">Melhorar o sistema com dados de uso.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={e => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                  aria-label="Cookies analíticos"
                />
                <div className="w-10 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-sm">Marketing</strong>
                <p className="text-xs text-gray-500">Publicidade personalizada.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={e => setMarketing(e.target.checked)}
                  className="sr-only peer"
                  aria-label="Cookies de marketing"
                />
                <div className="w-10 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
            <button
              onClick={() => saveConsent(analytics, marketing)}
              className="mt-2 w-full md:w-auto text-sm px-4 py-2 bg-gray-900 text-white rounded-lg"
            >
              Salvar preferências
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
