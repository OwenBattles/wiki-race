# wiki-race

A multiplayer Wikipedia racing game. Players start on the same article and race to reach
a target article using only in-article links. Optional power-ups let players swap pages
with an opponent or scramble an opponent to a random article.

## Layout

```
server/     Express + Socket.IO. Fetches and sanitises Wikipedia HTML, holds room state in memory.
client/     React + Vite SPA.
Dockerfile  Builds the client, then serves it from the Express server as a single service.
fly.toml    Fly.io deploy config (internal port 8080).
```

Room state lives only in server memory — restarting the server ends every in-progress game.

## Requirements

Node 20+ (see `.nvmrc`; Vite 7 requires 20.19 or newer).

## Running locally

Two terminals:

```bash
# Terminal 1 — API + socket server on :3000
cd server && npm install && npm run dev

# Terminal 2 — Vite dev server on :5173
cd client && npm install && npm run dev
```

Then open http://localhost:5173. The client reads the backend URL from
`client/.env.development` (`VITE_API_URL=http://localhost:3000`).

To play against yourself, open a second browser window (use a private window — two tabs in
the same profile still get separate socket connections, so either works).

## Production build

`client/.env.production` intentionally leaves `VITE_API_URL` empty: in the deployed
single-service setup the client is served by the Express server, so it falls back to
same-origin for both the REST API and the socket connection.

```bash
docker build -t wiki-race .
docker run -p 8080:8080 wiki-race
# or
fly deploy
```

## Environment variables

| Variable     | Where  | Purpose |
| ------------ | ------ | ------- |
| `PORT`       | server | Listen port. Defaults to 3000 in dev, 8080 in production. |
| `NODE_ENV`   | server | `production` enables serving `client/dist` and the SPA fallback. |
| `CLIENT_URL` | server | Optional comma-separated CORS allowlist for the socket server. Unset means "allow the requesting origin". |

Note there is no `dotenv` in the server — these must be real environment variables, not a
`.env` file.

## Scripts

```bash
cd server && npm run dev     # nodemon
cd server && npm start       # plain node
cd client && npm run dev     # vite dev server
cd client && npm run build   # production build into client/dist
cd client && npm run lint    # eslint
```

## Known issues

See the outstanding bug list before adding features — there are several known
gameplay-breaking issues in room/power-up state handling and move validation.
