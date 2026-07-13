---
trigger: always_on
---

# React, TypeScript, and Tailwind CSS Standards

## TypeScript Enforcement
- Avoid using `any` at all costs. Every function parameter, React Prop, and custom hook state must be explicitly typed with precise types or interfaces.
- Use `interface` for defining Component Props, and `type` exclusively for unions, intersections, or utility types.
- Always infer or explicitly define return types for complex custom hooks and API helper functions.

## Directory & File Conventions
- Use `.ts` for pure logic files (helpers, custom hooks, API services) and `.tsx` for React components containing JSX.
- Adhere to the Co-location principle: If a component, hook, or asset is specific to a single page, place it in that page's subdirectory (e.g., `src/pages/Home/HeroSection.tsx`), not in `src/components/common/`.
- Export components cleanly using Barrel Exports (`index.ts`) at the folder level to avoid deep nested import paths.

## Project Structure Standards
- Follow a feature-based architecture combined with shared resources separation.
- Keep the source code organized under the `src/` directory with the following structure:
 src/
├── assets/ # Static assets such as images, icons, fonts, and media files
├── components/ # Reusable UI components shared across multiple features (Button, Input, Modal)
├── features/ # Feature-based modules containing business logic and feature-specific components
│ └── Auth/ # Example feature module
│ ├── components/ # Components used only inside Auth feature
│ ├── services/ # API calls and backend communication related to Auth
│ └── index.ts # Barrel export for the feature
├── hooks/ # Global reusable custom React hooks
├── layouts/ # Application-level layouts (Navbar, Sidebar, Footer, Dashboard layouts)
├── pages/ # Complete page-level components composed from multiple components
├── routes/ # React Router configuration and route definitions
├── store/ # Global state management (only when Context API is insufficient)
├── styles/ # Global styling configuration and Tailwind CSS imports
├── types/ # Shared TypeScript interfaces, types, and API response definitions
├── utils/ # Pure utility functions (date formatting, currency formatting, helpers)
├── App.tsx # Root application component and layout/router composition
└── main.tsx # Application entry point that renders React into DOM 

- Do not place business logic directly inside page components. Move reusable logic into `features`, `hooks`, `services`, or `utils`.
- Do not create unnecessary folders. A folder should only exist when it has multiple related files or a clear responsibility.
- Feature-specific files must stay inside their feature directory and should not pollute global folders.
- Shared components must be placed in `src/components/` only when they are reused by multiple features.

## File Naming Convention
- React components must use PascalCase naming:
  - `UserProfile.tsx`
  - `LoginForm.tsx`
  - `QuizCard.tsx`
- Hooks must start with `use` and use camelCase:
  - `useAuth.ts`
  - `useQuiz.ts`
- Utility and service files must use camelCase:
  - `formatDate.ts`
  - `authService.ts`
- Type definition files should use meaningful names:
  - `user.types.ts`
  - `quiz.types.ts`

## Styling via Tailwind CSS
- **Strict Tailwind Utility:** Do not create separate `.css` or `.module.css` files unless absolutely necessary for third-party libraries. Write all styles inline via Tailwind utility classes.
- **Clean Class Ordering:** Keep class lists organized. Group utilities by:
  1. Layout (`flex`, `grid`, `container`, `position`)
  2. Box Model (`p`, `m`, `w`, `h`)
  3. Typography (`text`, `font`)
  4. Background/Borders (`bg`, `border`, `rounded`)
  5. Interactive states (`hover`, `focus`, `dark`)
- Global styles belong strictly to `src/index.css`. Do not inject custom style blocks inside individual page files.

## State Management & Hooks
- Prefer React Context API for global, rarely-changing state (e.g., Auth status, UI Theme).
- Do not install heavy state managers (Redux, Zustand) unless requested or the application complexity requires it.
- Keep components small and functional.
- Move complex state management, side effects, API calls, and heavy calculations into dedicated Custom Hooks (`src/hooks/`) or feature-specific hooks.

## Import Organization
- Imports must be grouped and ordered:
  1. React and third-party libraries.
  2. Internal absolute imports.
  3. Relative imports.
  4. Styles/assets imports.
- Avoid deeply nested imports:
  - ❌ `../../../components/Button`
  - ✅ `@/components/Button`
- Use path aliases (`@/`) when configured in Vite and TypeScript.

## Component Design Rules
- Components should follow the Single Responsibility Principle.
- Avoid creating extremely large components. Split components when they exceed reasonable complexity.
- Business logic should not be mixed with UI rendering.
- Reusable components must receive data through typed props instead of directly accessing external state.
- Every component must define explicit prop types using `interface`.

## API & Service Layer
- All API communication must be separated from components.
- Use dedicated service files inside `features/<feature>/services/` or `src/services/`.
- API response/request models must have explicit TypeScript types.
- Components should call hooks/services instead of directly calling API clients.

## Code Quality Rules
- Write clean, readable, and maintainable code.
- Avoid duplicated logic.
- Prefer composition over inheritance.
- Remove unused imports, variables, and dependencies.
- Follow ESLint and TypeScript strict mode rules.