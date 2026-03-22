# API Conventions

## Weather API
- All API calls live in `src/api/`
- Always handle loading, success, and error states
- Use `try/catch` with meaningful error messages
- Never expose API keys in client-side code — use environment variables
- Cache responses where appropriate to reduce API calls
- Implement retry logic for transient failures

## Data Flow
- Fetch data in parent components, pass down via props
- Use React state for API response data
- Transform API responses into clean, UI-friendly shapes in the API layer
