# Testing Conventions

## General
- This project does not currently have a test suite
- When adding tests, use Vitest + React Testing Library
- Place test files alongside source files with `.test.jsx` suffix
- Test component rendering, user interactions, and edge cases

## Guidelines
- Test behavior, not implementation details
- Mock API calls — never make real network requests in tests
- Use `screen.getByRole()` and other accessible queries over `getByTestId()`
- Cover error states and loading states for API-dependent components
