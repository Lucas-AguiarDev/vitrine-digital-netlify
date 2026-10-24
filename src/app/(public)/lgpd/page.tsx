'use client'

import { useState } from 'react'

export default function LgpdPage() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/lgpd/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      })

      await res.json()
      if (res.ok) setStatus('done')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Direitos LGPD</h1>
      <p className="text-gray-600 mb-8">
        Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar
        acesso, correção ou exclusão dos seus dados pessoais.
      </p>

      <div className="grid gap-4 mb-10">
        {[
          ['Acesso', 'Obter uma cópia dos seus dados que armazenamos'],
          ['Correção', 'Atualizar dados incompletos ou incorretos'],
          ['Exclusão', 'Apagar seus dados da nossa base'],
          ['Portabilidade', 'Receber seus dados em formato estruturado'],
          ['Revogação', 'Retirar consentimentos concedidos'],
        ].map(([title, desc]) => (
          <div key={title} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>{title}</strong>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Formulário de Solicitação</h2>

        {status === 'done' ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✓</div>
            <p className="font-semibold">Solicitação recebida.</p>
            <p className="text-gray-600 text-sm mt-1">
              Responderemos em até 15 dias úteis no e-mail informado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                maxLength={254}
                placeholder="seu@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de solicitação *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="exclusao">Exclusão de dados</option>
                <option value="acesso">Acesso aos meus dados</option>
                <option value="correcao">Correção de dados</option>
                <option value="portabilidade">Portabilidade</option>
                <option value="revogacao">Revogação de consentimento</option>
              </select>
            </div>

            {status === 'error' && (
              <p className="text-red-600 text-sm">Erro ao enviar. Tente novamente ou envie por e-mail.</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 font-medium text-sm disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar solicitação'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Também pelo e-mail:{' '}
              <a href="mailto:privacidade@mvaestudio.com.br" className="underline">
                privacidade@mvaestudio.com.br
              </a>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
