# Contributing

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9 (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Git**

## Setup

```bash
git clone <your-fork>
 cd svelte-virtual-swipe
pnpm install
```

`pnpm install` runs from the root — the workspace wires `packages/swipe` (the library) and `apps/demo` (the dev app).

## Development

```bash
pnpm dev
```

Starts the demo app at `http://localhost:5173`. Changes to `packages/swipe/src/lib/` are hot-reloaded automatically via the workspace dependency.

### Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start demo dev server |
| `pnpm build` | Build the swipe package via `svelte-package` |
| `pnpm test` | Run unit tests (vitest) |
| `pnpm check` | Run Svelte check on the demo app |
| `pnpm demo:check` | Alias for `pnpm check` |

Run a command scoped to a single package:

```bash
 pnpm --filter=svelte-virtual-swipe <cmd>
pnpm --filter=@demo/app <cmd>
```

## Project structure

```
 svelte-virtual-swipe/
├── packages/swipe/          # The published npm package
│   ├── src/lib/
│   │   ├── Swipe.svelte     # Main component
│   │   └── types.ts         # SwipeProps type
│   └── tests/
│       └── Swipe.test.ts    # Vitest tests
├── apps/demo/               # SvelteKit demo app
├── pnpm-workspace.yaml      # Workspace config
└── package.json             # Root scripts
```

## Code style

- **Svelte 5 runes** (`$state`, `$derived`, etc.) — no legacy `let x` for reactive state.
- **TypeScript** — props typed via `types.ts`; prefer explicit types over inference at module boundaries.
- **No Prettier / ESLint** enforced — just keep it consistent with surrounding code.

## Testing

Tests live in `packages/swipe/tests/`. They use vitest + happy-dom and mount the component headlessly.

```bash
pnpm test                # all tests
pnpm test:watch          # watch mode
 pnpm --filter=svelte-virtual-swipe test -- -t "specific test name"  # single test
```

Write tests for:
- Pointer event handling (`pointerType: 'touch'` vs `'mouse'`)
- Edge cases (single page, rapid swipes, boundary overscroll)
- `touchOnly` / `globalGestures` prop combinations

Run the full suite before opening a PR. All tests must pass.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your changes — keep them focused. One feature or fix per PR.
3. Run `pnpm test` and `pnpm build` and confirm both pass.
4. Open a PR against `main`. Describe *what* changed and *why*.
5. A maintainer will review and merge.

## Release process

Maintainers publish to npm from `main`.

### 1. Prepare the release

```bash
cd packages/swipe
npm version patch   # or minor / major
```

This bumps the version in `package.json` and creates a Git tag (`v0.1.1`, etc.). Push the tag:

```bash
git push --tags
```

### 2. Build

```bash
pnpm build
```

Runs `svelte-package`, which outputs to `packages/swipe/dist/`.

### 3. Dry run (optional but recommended)

```bash
cd packages/swipe
npm pack --dry-run
```

Verify only the expected files ship (`dist/`, no source maps of tests leaked).

### 4. Publish

```bash
cd packages/swipe
npm publish --access public
```

The `prepublishOnly` script in `package.json` runs `svelte-package` automatically as a guard, but it's safer to build explicitly first and verify.

### Versioning

This project follows [semver](https://semver.org/):

- **Patch** — bug fixes, doc updates, internal refactors (no public API change)
- **Minor** — new features, new optional props, deprecations (backward compatible)
- **Major** — breaking prop changes, removed APIs, backward-incompatible behavior changes

The current major version is **0** (initial development). Breaking changes may land in minor bumps until 1.0.

### npm access

 You need npm credentials with publish access to the `svelte-virtual-swipe` package:

```bash
npm login
```

 The package name is `svelte-virtual-swipe` on the public registry.
