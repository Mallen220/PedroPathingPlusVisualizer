# Contributing

We welcome contributions to the Pedro Pathing Visualizer!

## Getting Setup

1. **Fork the Repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PedroPathingVisualizer.git
   cd PedroPathingVisualizer
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
   *Note: Ensure you are using Node.js 18 or newer.*

## Development Workflow

### Running the App
Start the development server with:
```bash
npm run dev
```
This will launch the Electron app with hot-reloading enabled.

### Code Style
We use **Prettier** for code formatting.
- Run `npm run format` to auto-format your code.
- Run `npm run check` to run TypeScript type checking.

### Testing
We use **Vitest** for testing.
- Run `npm run test` to execute the test suite.
- Please add tests for any new features you implement.

## Pull Requests

1. Create a new branch for your feature: `git checkout -b feature/my-cool-feature`.
2. Commit your changes.
3. Push to your fork.
4. Open a Pull Request against the `main` branch of the original repository.

Please include a clear description of your changes and screenshots if applicable.

## Architecture

- **Frontend**: Svelte + Tailwind CSS
- **Backend**: Electron (Main Process)
- **State Management**: Svelte Stores
- **Rendering**: Two.js (Canvas/SVG)

See the `src/` directory for the source code.
