# Nummia

Nummia is being built as a personal finance management platform. Its goal is to help people understand, organize, and improve their financial lives by bringing financial information together, automating routine tasks, and using AI agents to provide assistance.

> **Project status:** This repository currently contains an early frontend scaffold built with React, TanStack Start, and Vite. The product features described above are the project vision and are not yet implemented in this app.

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

## Useful scripts

- `npm run dev` — start the development server on port 3000.
- `npm run build` — build the production app into `dist/`.
- `npm run preview` — preview the production build locally.
- `npm run lint` — run ESLint.
- `npm run check` — check formatting with Prettier.
