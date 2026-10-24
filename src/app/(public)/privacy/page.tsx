import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Vitrine Digital MVA',
  description: 'Como coletamos, usamos e protegemos seus dados pessoais.',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-neutral">
      <h1>Política de Privacidade</h1>
      <p className="text-sm text-gray-500">Última atualização: outubro de 2024</p>

      <h2>1. Controlador dos Dados</h2>
      <p>
        <strong>MVA Estúdio Criativo LTDA</strong><br />
        CNPJ: 42.872.312/0001-35<br />
        São Leopoldo, RS — Brasil<br />
        E-mail: <a href="mailto:privacidade@mvaestudio.com.br">privacidade@mvaestudio.com.br</a>
      </p>

      <h2>2. Dados que Coletamos</h2>
      <p>Coletamos apenas os dados necessários para o funcionamento do serviço:</p>
      <ul>
        <li><strong>Cadastro:</strong> nome completo e e-mail do lojista</li>
        <li><strong>Operação da loja:</strong> nome da loja, WhatsApp, produtos e imagens</li>
        <li><strong>Pedidos:</strong> nome, telefone e endereço dos clientes finais (fornecidos voluntariamente)</li>
        <li><strong>Uso:</strong> logs de acesso para segurança (sem rastreamento de comportamento)</li>
        <li><strong>Cookies:</strong> apenas cookies essenciais para autenticação (sem cookies de rastreamento por padrão)</li>
      </ul>

      <h2>3. Finalidade e Base Legal</h2>
      <ul>
        <li>Prestação do serviço contratado (Art. 7º, V — LGPD)</li>
        <li>Segurança e prevenção de fraudes (Art. 7º, IX — LGPD)</li>
        <li>Cumprimento de obrigações legais (Art. 7º, II — LGPD)</li>
        <li>Analytics e melhorias, apenas com consentimento explícito (Art. 7º, I — LGPD)</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>
        Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins
        publicitários. Compartilhamos apenas com:
      </p>
      <ul>
        <li><strong>Supabase Inc.:</strong> infraestrutura de banco de dados (servidores na UE/EUA com adequação SCCs)</li>
        <li><strong>Vercel Inc.:</strong> hospedagem do sistema</li>
        <li><strong>WhatsApp/Meta:</strong> apenas quando o cliente final aciona o botão de pedido voluntariamente</li>
      </ul>

      <h2>5. Seus Direitos (LGPD — Art. 18)</h2>
      <p>Você tem direito a:</p>
      <ul>
        <li>Confirmar a existência do tratamento</li>
        <li>Acessar seus dados</li>
        <li>Corrigir dados incompletos ou desatualizados</li>
        <li>Solicitar anonimização, bloqueio ou eliminação</li>
        <li>Portabilidade dos dados</li>
        <li>Revogar o consentimento</li>
      </ul>
      <p>
        Para exercer seus direitos:{' '}
        <a href="/lgpd">Formulário de Solicitação LGPD</a> ou e-mail para{' '}
        <a href="mailto:privacidade@mvaestudio.com.br">privacidade@mvaestudio.com.br</a>.
        Respondemos em até <strong>15 dias úteis</strong>.
      </p>

      <h2>6. Retenção de Dados</h2>
      <ul>
        <li>Conta ativa: dados mantidos durante a vigência do contrato</li>
        <li>Após cancelamento: dados excluídos em até 90 dias</li>
        <li>Logs de segurança: 6 meses</li>
        <li>Pedidos: 5 anos (obrigação fiscal)</li>
      </ul>

      <h2>7. Segurança</h2>
      <p>
        Utilizamos criptografia em trânsito (TLS 1.2+), autenticação por token JWT,
        controle de acesso por Row Level Security no banco de dados e monitoramento
        contínuo de acessos suspeitos.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Utilizamos apenas cookies essenciais para autenticação e segurança da sessão.
        Cookies analíticos e de marketing são opcionais e requerem seu consentimento explícito,
        que pode ser retirado a qualquer momento no banner de cookies.
      </p>

      <h2>9. Contato — DPO</h2>
      <p>
        Encarregado de Proteção de Dados: Lucas — MVA Estúdio Criativo<br />
        <a href="mailto:privacidade@mvaestudio.com.br">privacidade@mvaestudio.com.br</a>
      </p>
    </main>
  )
}
