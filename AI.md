# Ambient Weather

> A beautiful, ambient weather application built with React.

## Tech Stack

- **Framework**: Vite + React 18
- **Icons**: Lucide React
- **Language**: JavaScript (JSX)
- **Styling**: Vanilla CSS (true black, white text, amber accent only where meaningful)
- **Data**: Open-Meteo (forecast, minutely_15, us_aqi, geocoding), BigDataCloud reverse geocode, RainViewer radar
- **PWA**: vite-plugin-pwa (Workbox) — the only service worker
- **Tests/CI**: Vitest + ESLint, GitHub Actions

## Project Structure

```
src/
├── App.jsx          # Main app component
├── main.jsx         # Entry point
├── index.css        # Global styles
├── api/             # Weather API integration
├── hooks/           # useWeather (state, caching, GPS)
├── components/      # UI components
└── utils/           # Utility functions
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
npm test         # Vitest
npm run size     # Bundle budget (after build)
```

## Conventions

- Components are `.jsx` files in `src/components/`
- API calls live in `src/api/`
- Utility/helper functions go in `src/utils/`
- Use Lucide React for all icons
- CSS follows BEM-like naming within component-scoped styles
- Responsive design: mobile-first approach
- Minimal dark UI: no grey/blue accents; amber/red only for warnings (AQI, UV, heat)
- Parse Open-Meteo times with `parseLocalTime`, never `new Date(string)`
- Respect `prefers-reduced-motion`; interactive elements are real `<button>`s with labels
