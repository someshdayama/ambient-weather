# Code Style Rules

## JavaScript / JSX
- Use functional components with hooks (no class components)
- Destructure props in function parameters
- Use `const` by default, `let` only when reassignment is needed
- Use arrow functions for component definitions and callbacks
- Use template literals for string interpolation
- Prefer optional chaining (`?.`) and nullish coalescing (`??`)

## Naming
- **Components**: PascalCase (e.g., `WeatherCard`, `TemperatureDisplay`)
- **Files**: Match the component name (e.g., `WeatherCard.jsx`)
- **Functions/variables**: camelCase
- **CSS classes**: kebab-case or BEM (e.g., `weather-card__title`)
- **Constants**: UPPER_SNAKE_CASE

## CSS
- Use CSS custom properties (variables) for theming
- Mobile-first responsive design
- Use `rem`/`em` units over `px` where appropriate
- Glassmorphism, gradients, and subtle animations for premium feel
- Smooth transitions (0.2s–0.3s ease) for interactive elements

## Imports
- Group imports: React → third-party → local components → styles
- Use relative paths for local imports
