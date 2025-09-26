# Web Component Framework Renderer

A TypeScript-based framework for rendering web components with Vite as the build tool.

## Features

- Modern TypeScript support
- Fast development with Vite
- ESLint for code quality
- Path aliases for clean imports

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm (v7 or later recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd web-component-framework-renderer

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

This will start the Vite development server at http://localhost:3000 with hot module replacement (HMR).

### Building for Production

```bash
# Build for production
npm run build
```

The production build will be available in the `dist` directory.

### Preview Production Build

```bash
# Preview the production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
/
├── src/                  # Source code
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Main entry point
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.json        # ESLint configuration
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

## License

ISC
# mfe-builder
