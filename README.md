# Nummia

Nummia is being built as a personal finance management platform. Its goal is to help people understand, organize, and improve their financial lives by bringing financial information together, automating routine tasks, and using AI agents to provide assistance.

> **Status do projeto:** início do front-end do MVP. Todas as telas previstas no planejamento existem e funcionam com **dados simulados (mocks)** até o back-end (Spring Boot) estar disponível.

## Stack

React 19 · TypeScript · Vite · TanStack Router (rotas por arquivo) · Tailwind CSS v4 · componentes no padrão shadcn/ui (Radix) · Recharts · Axios · Lucide Icons.

## Telas

| Rota | Tela |
| --- | --- |
| `/login`, `/cadastro` | Login e cadastro |
| `/dashboard` | Dashboard financeiro (indicadores, fluxo de caixa, gastos por categoria, insights) |
| `/movimentacoes` | Receitas e despesas, com filtros por mês, tipo, categoria e busca |
| `/contas` | Contas e cartões |
| `/categorias` | Categorias e limites mensais |
| `/metas` | Metas financeiras |
| `/assistente` | Assistente de IA (chat) |
| `/configuracoes` | Perfil, tema, notificações e privacidade (LGPD) |

## Estrutura

```
src/
  components/ui/       componentes base (padrão shadcn/ui; components.json pronto para o CLI)
  components/layout/   sidebar, header, page header, estados vazios/erro
  components/charts/   gráficos (Recharts)
  features/auth/       store de autenticação (JWT) e hook useAuth
  services/            camada de acesso à API — cada função usa mocks ou Axios
  mocks/               dados simulados
  lib/                 cliente Axios, env, utilitários de formatação
  types/               tipos de domínio (contrato esperado da API)
  routes/              rotas: _auth (públicas) e _app (protegidas)
```

## Integração com o back-end

Copie `.env.example` para `.env` e defina `VITE_API_URL`. Sem essa variável, o app roda em **modo demonstração** (qualquer e-mail + senha com 6+ caracteres). Os endpoints esperados estão nos arquivos de `src/services/` e os formatos de dados em `src/types/`. O token JWT é enviado no header `Authorization: Bearer` e uma resposta 401 encerra a sessão.

## Run locally with npm

Requirements: Node.js and npm. From the project directory, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Vite serves the app in development and reloads it as you edit files.

To create a production build and serve it locally for a quick preview:

```sh
npm run build
npm run preview
```

## Run with Docker

The included Dockerfile builds the frontend and serves the production files with Nginx. From the project directory, build the image and start a container:

```sh
docker build -t nummia .
docker run --rm -p 8080:80 nummia
```

Open [http://localhost:8080](http://localhost:8080). The container listens on port 80; the command maps it to port 8080 on your machine. Press `Ctrl+C` to stop it.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site whenever code is pushed to `main` or `develop`. It also supports manual runs from the repository's **Actions** tab. The build uses `/Nummia/` as its base path for this repository.

To enable deployment, open the repository's **Settings → Pages** and set the build and deployment source to **GitHub Actions**. After the workflow completes, the site is available at [https://lukefalcox.github.io/Nummia/](https://lukefalcox.github.io/Nummia/).

## Useful scripts

- `npm run dev` — start the development server on port 3000.
- `npm run build` — build the production app into `dist/`.
- `npm run preview` — preview the production build locally.
- `npm run lint` — run ESLint.
- `npm run check` — check formatting with Prettier.
