# Nummia

Nummia is being built as a personal finance management platform. Its goal is to help people understand, organize, and improve their financial lives by bringing financial information together, automating routine tasks, and using AI agents to provide assistance.

> **Status do projeto:** front-end do MVP integrado à API do [Nummia-Back](https://github.com/LukeFalcox/Nummia-Back). Sem back-end configurado, roda em **modo demonstração** com um back-end simulado no navegador.

## Stack

React 19 · TypeScript · Vite · TanStack Router (rotas por arquivo) · Tailwind CSS v4 · componentes no padrão shadcn/ui (Radix) · Recharts · Axios · Lucide Icons.

## Telas

| Rota | Tela | Endpoints principais |
| --- | --- | --- |
| `/login`, `/cadastro` | Login e cadastro | `/auth/*` |
| `/dashboard` | Indicadores, receitas × despesas, gastos por categoria, recomendações, orçamentos e metas | `/dashboard`, `/analysis/recommendations` |
| `/movimentacoes` | Receitas, despesas e transferências, com filtros, busca, paginação e edição | `/transactions`, `/analysis/summary` |
| `/contas` | Contas e cartões (arquivar quando houver movimentações) | `/accounts` |
| `/categorias` | Categorias, orçamentos do mês, sugestões de limite e cópia do mês anterior | `/categories`, `/budgets`, `/analysis/budget-suggestions` |
| `/metas` | Metas, aportes, resgates e histórico | `/goals` |
| `/assistente` | Chat com o assistente de IA | `/assistant/*` |
| `/configuracoes` | Perfil, preferências, troca de senha e exclusão da conta (LGPD) | `/users/me` |
| (cabeçalho) | Sino de notificações com contador | `/notifications` |

## Estrutura

```
src/
  api/api.ts           cliente Axios (JWT + refresh automático) e funções de cada endpoint
  api/types.ts         tipos da API — copiados do Nummia-Back, mantenha sincronizado
  api/mock/            back-end simulado do modo demonstração (mesmos endpoints e erros)
  components/ui/       componentes base (padrão shadcn/ui; components.json pronto para o CLI)
  components/          layout, gráficos, formulários e componentes compartilhados
  features/auth/       sessão do usuário (useAuth)
  lib/                 env, formatação de moeda, datas e percentuais
  routes/              rotas: _auth (públicas) e _app (protegidas)
```

## Rodando com o back-end

1. Suba o [Nummia-Back](https://github.com/LukeFalcox/Nummia-Back) (API em `http://localhost:8080`, Swagger em `/swagger-ui.html`).
2. Crie o `.env` a partir do exemplo e reinicie o `npm run dev`:
   ```sh
   cp .env.example .env
   ```
3. O front roda em `http://localhost:5173`, a origem que o back-end libera no CORS por padrão. Em outra porta ou domínio (ex.: Codespaces), adicione a origem em `CORS_ALLOWED_ORIGINS` no `.env` do back-end.

Detalhes da integração:
- O `accessToken` (15 min) vai em `Authorization: Bearer`. Num 401, o `api.ts` chama `/auth/refresh` uma única vez (o refresh token é de uso único), salva os tokens novos e repete a requisição. Se o refresh falhar, a sessão é encerrada e o app volta para `/login`.
- Erros 400 aparecem embaixo de cada campo; 409 e 422 mostram o `detail` da API. Excluir conta ou categoria em uso (409) oferece arquivar.
- `PUT` substitui o registro inteiro, então os formulários de edição sempre enviam todos os campos.
- Datas `yyyy-MM-dd` são tratadas no fuso local (`src/lib/utils.ts`), sem o problema de `new Date("2026-11-27")` mostrar o dia anterior.

## Modo demonstração

Sem `VITE_API_URL`, um back-end simulado em memória (`src/api/mock/`) responde aos mesmos endpoints, com os mesmos formatos e erros. Entre com qualquer e-mail e uma senha de 8+ caracteres. Os dados voltam ao exemplo inicial ao recarregar a página. É o modo usado no GitHub Pages.

## Run locally with npm

Requirements: Node.js and npm. From the project directory, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite serves the app in development and reloads it as you edit files.

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

- `npm run dev` — start the development server on port 5173.
- `npm run build` — build the production app into `dist/`.
- `npm run preview` — preview the production build locally.
- `npm run lint` — run ESLint.
- `npm run check` — check formatting with Prettier.
