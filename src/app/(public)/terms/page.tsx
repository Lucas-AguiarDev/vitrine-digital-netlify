import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — Vitrine Digital MVA',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-neutral">
      <h1>Termos de Uso</h1>
      <p className="text-sm text-gray-500">Última atualização: outubro de 2024</p>

      <h2>1. Serviço</h2>
      <p>
        A <strong>Vitrine Digital</strong> é um sistema de catálogo online com pedidos via WhatsApp,
        desenvolvido e operado pela <strong>MVA Estúdio Criativo LTDA</strong> (CNPJ 42.872.312/0001-35).
      </p>

      <h2>2. Uso Permitido</h2>
      <ul>
        <li>Cadastrar e exibir produtos para venda legítima</li>
        <li>Receber pedidos de clientes via WhatsApp</li>
        <li>Gerenciar sua loja no painel administrativo</li>
      </ul>

      <h2>3. Uso Proibido</h2>
      <ul>
        <li>Cadastrar produtos ilegais, falsificados ou que violem direitos autorais</li>
        <li>Usar o sistema para spam, phishing ou fraude</li>
        <li>Tentar acessar contas ou dados de outros lojistas</li>
        <li>Realizar engenharia reversa ou tentativas de invasão</li>
      </ul>

      <h2>4. Planos e Pagamento</h2>
      <p>
        O serviço é cobrado conforme plano contratado. A inadimplência por mais de 30 dias
        pode resultar na suspensão da loja. Os dados ficam preservados por 90 dias após suspensão.
      </p>

      <h2>5. Política de Reembolso</h2>
      <ul>
        <li><strong>Setup (implantação):</strong> reembolso integral em até 7 dias após a contratação, se o sistema não tiver sido configurado</li>
        <li><strong>Mensalidade:</strong> não há reembolso proporcional de mensalidade já paga</li>
        <li><strong>Cancelamento:</strong> pode ser solicitado a qualquer momento; a loja fica ativa até o fim do período pago</li>
      </ul>
      <p>
        Solicitações: <a href="mailto:contato@mvaestudio.com.br">contato@mvaestudio.com.br</a>
      </p>

      <h2>6. Disponibilidade</h2>
      <p>
        Buscamos 99,5% de uptime mensal. Manutenções programadas são comunicadas com
        24h de antecedência. Não nos responsabilizamos por indisponibilidades causadas por
        terceiros (Supabase, Vercel, WhatsApp).
      </p>

      <h2>7. Propriedade Intelectual</h2>
      <p>
        O sistema é de propriedade da MVA Estúdio Criativo. O conteúdo cadastrado
        (produtos, imagens, textos) é de responsabilidade exclusiva do lojista.
      </p>

      <h2>8. Limitação de Responsabilidade</h2>
      <p>
        A MVA não se responsabiliza por negociações realizadas entre lojistas e clientes finais,
        pelo conteúdo publicado pelos lojistas, nem por perdas indiretas decorrentes do uso do sistema.
      </p>

      <h2>9. Legislação Aplicável</h2>
      <p>
        Estes termos são regidos pelo Código Civil Brasileiro (Lei 10.406/2002),
        Código de Defesa do Consumidor (Lei 8.078/1990),
        Marco Civil da Internet (Lei 12.965/2014),
        Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018)
        e demais legislações brasileiras aplicáveis.
      </p>
      <p>Foro eleito: comarca de São Leopoldo, RS.</p>

      <h2>10. Contato</h2>
      <p>
        MVA Estúdio Criativo LTDA — CNPJ 42.872.312/0001-35<br />
        <a href="mailto:contato@mvaestudio.com.br">contato@mvaestudio.com.br</a><br />
        <a href="https://mvaestudio.com.br" target="_blank" rel="noopener noreferrer">mvaestudio.com.br</a>
      </p>
    </main>
  )
}
