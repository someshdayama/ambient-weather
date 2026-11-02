# Ambient Weather

Minimal, dark weather PWA: current conditions, 24 h chart, 7-day forecast, US AQI with a
24 h trend, rain nowcast ("rain in ~20 min"), and a map with live rain radar.

**Live:** https://ambientweather.netlify.app

## Stack

- React 18 + Vite 5, plain CSS (`src/index.css`)
- [Open-Meteo](https://open-meteo.com) — forecast, `minutely_15` precipitation, air quality (`us_aqi`), geocoding. Keyless; free tier is non-commercial / fair use.
- [BigDataCloud](https://www.bigdatacloud.com) client reverse geocoding (keyless)
- Leaflet + Esri tiles (dark canvas, satellite) + [RainViewer](https://www.rainviewer.com/api.html) radar (native zoom ≤ 7 on the free tier, upscaled beyond)
- `vite-plugin-pwa` (Workbox): precached app shell, NetworkFirst cache for Open-Meteo, CacheFirst for map tiles
- Self-hosted Outfit font (`@fontsource/outfit`)

No API keys, no backend.

## Layout

```
src/
├── App.jsx                 # shell: units, favourites, toast, layout
├── hooks/useWeather.js     # all weather state: cache-first boot, latest-request-wins, GPS
├── api/weatherApi.js       # Open-Meteo / BigDataCloud / RainViewer calls (AbortSignal aware)
├── utils/weatherUtils.js   # pure helpers: time parsing, units, AQI bands, nowcast (+ tests)
├── utils/storage.js        # never-throwing localStorage helpers
└── components/             # Sidebar, Dashboard, WeatherMap (lazy), charts, cards, Toast
```

Behaviour worth knowing:

- **Instant start:** the last forecast is kept in `localStorage` and rendered immediately, then refreshed. Opens on the last viewed place → first favourite → Mumbai (first run only).
- **Time:** Open-Meteo returns wall-clock strings in the location's zone. They're parsed by `parseLocalTime` (never `new Date(string)`, which is unreliable in Safari) and formatted with `timeZone: 'UTC'`, so the device timezone never leaks in.
- **Errors** never wipe good data; they show a toast with Retry. Data older than 30 min is flagged.
- **°F mode** also switches wind to mph.

## Develop

```bash
npm ci
npm run dev       # http://localhost:5173
npm run lint
npm test          # vitest
npm run build && npm run size   # bundle budget: initial JS ≤ 130 kB gzip
```

## Deploy

Netlify site `ambientweather`. `netlify.toml` holds build settings, security headers (CSP,
Permissions-Policy, etc.) and immutable caching for `/assets/*`.

Manual deploy from `main`:

```bash
npm ci && npm run build && netlify deploy --prod --dir dist
```

CI (`.github/workflows-pending/ci.yml`, to be moved to `.github/workflows/`) runs lint, tests, `npm audit --omit=dev`, build and the bundle budget on every PR and push to `main`. The same checks run locally: `npm run lint && npm test && npm audit --omit=dev && npm run build && npm run size`.
