# Resolvoja

> Hub de soluções com IA para pequenas empresas brasileiras. O empresário escolhe a área do problema, descreve o contexto e recebe na hora um diagnóstico e um plano de ação gerados por IA.

🌐 **Em produção:** [resolvoja.com](https://resolvoja.com)

---

## ✨ Funcionalidades

- **Consultor de IA por área:** 7 áreas de negócio (Gestão, Operações, Contábil & Tributário, Administrativo, Tecnologia, Estoque & Compras, Pessoas & RH), cada uma com subdivisões. A IA (Claude) entrega um diagnóstico, a estrutura da solução e um primeiro passo prático.
- **Contas de usuário:** cadastro, login, verificação de e-mail e recuperação de senha.
- **Assinaturas e produtos avulsos:** planos recorrentes e compra única via **Stripe**.
- **Briefings e pedidos de consultoria:** o cliente envia o contexto e o time acompanha tudo pelo painel admin, com notificação por e-mail (**Resend**).
- **Painel administrativo:** acesso restrito por lista de e-mails autorizados.

## 🏗️ Arquitetura

```
┌──────────────┐     HTTPS      ┌──────────────────┐      ┌──────────────┐
│  apps/web    │ ─────────────▶ │  apps/api        │ ───▶ │  Claude API  │
│  React+Vite  │                │  Node/Express    │ ───▶ │  Stripe      │
└──────┬───────┘                └────────┬─────────┘      └──────────────┘
       │  auth / dados                   │ valida token
       ▼                                 ▼
┌─────────────────────────────────────────────────┐
│  apps/pocketbase: auth, banco (SQLite), regras  │
│  de acesso por coleção, hooks e envio de e-mail │
└─────────────────────────────────────────────────┘
```

Monorepo com três serviços, cada um publicado como um serviço separado no **Railway**.

| Serviço | Stack | Responsabilidade |
|---|---|---|
| `apps/web` | React, Vite, Tailwind, shadcn/ui | Interface, rotas e fluxo de compra |
| `apps/api` | Node.js, Express | Chamadas ao LLM, Stripe e rotas administrativas |
| `apps/pocketbase` | PocketBase (Go + SQLite) | Autenticação, banco, regras de acesso, migrations e hooks |

## 🔒 Segurança

- CORS fechado por padrão, `helmet` e rate limit global, mais um limite específico para as rotas de IA.
- Todas as rotas sensíveis validam o token do PocketBase no backend.
- Painel admin **fail-closed**: sem lista de admins configurada, ninguém tem acesso.
- Regras por coleção no PocketBase: cada usuário só enxerga os próprios briefings, pedidos e mensagens.
- Segredos só em variáveis de ambiente, nunca no código.

## 🚀 Como rodar localmente

Pré-requisitos: Node 22 (`.nvmrc`).

```bash
npm install

# apps/api/.env
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=...
POCKETBASE_URL=http://localhost:8090
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAILS=voce@exemplo.com

npm run dev   # web :3000 · api :3001 · pocketbase :8090
```

## 🛣️ Próximos passos

- [ ] Testes automatizados da API e CI no GitHub Actions
- [ ] Histórico de consultas por usuário
- [ ] Soluções completas geradas em formato de planilha e POP

---

Desenvolvido por [Arthur Penedo](https://github.com/arthurpenedo) · [LinkedIn](https://www.linkedin.com/in/arthurpenedo)
