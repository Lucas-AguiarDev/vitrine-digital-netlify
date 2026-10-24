# Vitrine Digital — MVA Estúdio Criativo

Sistema SaaS de catálogo online com pedidos via WhatsApp.
**Stack:** Next.js 14 + Supabase + Vercel

---

## 🚀 Deploy em 6 passos

### 1. Supabase — banco de dados

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Em **SQL Editor**, execute em ordem:
   - `/supabase/schema.sql` — cria todas as tabelas e políticas RLS
   - `/supabase/storage-policies.sql` — configura o bucket de uploads
3. Em **Settings > API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **NUNCA expor no frontend**
4. Em **Authentication > Settings**, configure:
   - Site URL: `https://seudominio.com.br`
   - Redirect URLs: `https://seudominio.com.br/admin`

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Gere um APP_SECRET aleatório:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy na Vercel

```bash
npm i -g vercel
vercel
```

Na Vercel, vá em **Settings > Environment Variables** e adicione todas as variáveis do `.env.local`.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` deve ter escopo **Production + Preview**, nunca client-side.

### 4. Domínio customizado

Na Vercel, vá em **Settings > Domains** e adicione `seudominio.com.br`.
Configure os DNS do cliente apontando para a Vercel.

### 5. Verificar segurança

Acesse [securityheaders.com](https://securityheaders.com) com a URL do sistema.
Esperado: nota **A** ou superior.

### 6. Debug desligado em produção

O sistema já está configurado para não expor erros detalhados em produção.
Nunca faça deploy com `NODE_ENV=development`.

---

## 💰 Modelo de precificação sugerido

| Item | Valor |
|------|-------|
| Setup + implantação | R$ 1.200 |
| Mensalidade (hospedagem + suporte) | R$ 97–197/mês |
| Domínio do cliente (.com.br) | R$ 40/ano |
| Hora extra de alteração | R$ 150/h |

---

## 🔒 Segurança implementada

- ✅ Senhas nunca no código — apenas variáveis de ambiente
- ✅ Chave service_role nunca exposta ao frontend
- ✅ Autenticação real via Supabase Auth (JWT)
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Rate limiting em login (5 tentativas / 15 min)
- ✅ Sanitização de todos os inputs do usuário
- ✅ Validação Zod em todas as API routes
- ✅ Upload: validação de tipo MIME + magic bytes + tamanho
- ✅ Storage policies: cada lojista acessa apenas seu diretório
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ CORS configurado por domínio
- ✅ Mensagens de erro genéricas (sem stack trace)
- ✅ Debug desligado em produção
- ✅ IPs nunca armazenados (apenas hash)

## 📋 LGPD implementada

- ✅ Política de Privacidade com dados da MVA
- ✅ Termos de Uso com política de reembolso
- ✅ Banner de cookies com configuração granular
- ✅ Formulário de solicitação de exclusão de dados
- ✅ Log de consentimentos
- ✅ Apenas dados necessários coletados
- ✅ Retenção de dados definida
- ✅ DPO identificado (Lucas — MVA)

## ♿ Acessibilidade

- ✅ Textos alternativos em todas as imagens
- ✅ Contraste WCAG AA
- ✅ Navegação por teclado (focus visível)
- ✅ Roles ARIA em modais e dialogs
- ✅ Labels em todos os formulários
- ✅ Botões com textos descritivos

---

## 📁 Estrutura

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/      ← Login com rate limiting
│   │   ├── stores/          ← CRUD de lojas
│   │   ├── products/        ← CRUD de produtos
│   │   ├── upload/          ← Upload seguro com validação magic bytes
│   │   └── lgpd/            ← Solicitações LGPD
│   ├── (public)/
│   │   ├── privacy/         ← Política de privacidade
│   │   ├── terms/           ← Termos de uso
│   │   └── lgpd/            ← Formulário LGPD
│   ├── admin/               ← Painel do lojista (protegido)
│   └── store/               ← Vitrine pública por slug
├── components/
│   └── shared/CookieBanner  ← Banner LGPD
├── lib/
│   ├── supabase/            ← Clientes browser/server/service
│   ├── security/            ← Rate limit + sanitização
│   └── validation/          ← Schemas Zod
├── middleware.ts             ← Auth + security headers + CORS
├── types/                   ← TypeScript types
supabase/
├── schema.sql               ← Tabelas + RLS
└── storage-policies.sql     ← Políticas de upload
```
