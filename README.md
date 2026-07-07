 # svelte-virtual-swipe

Touch-driven horizontal page flip component for Svelte 5.

Swipe gestures with no dependencies, SSR support, and configurable thresholds. Built on Pointer Events — works across touch, mouse, and pen input.

## Install

```sh
 npm install svelte-virtual-swipe
 pnpm add svelte-virtual-swipe
 yarn add svelte-virtual-swipe
```

Requires `svelte@^5.0.0` as a peer dependency.

## Quick Start

```svelte
<script lang="ts">
 	import Swipe from 'svelte-virtual-swipe';

	const totalPages = 4;
	let currentPage = $state(0);
</script>

<Swipe {totalPages} bind:currentPage>
	{#snippet pageContent(idx)}
		<div class="page" style="background: {colors[idx]}">
			Page {idx + 1}
		</div>
	{/snippet}
</Swipe>
```

### SSR

The component renders a static fallback during SSR — pages render stacked vertically, no interactivity. Once JavaScript hydrates, swipe behavior is enabled.

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pageContent` | `Snippet<[number]>` | — | Renders page content for a given 0-based index. |
| `totalPages` | `number` | — | Total number of pages. |
| `currentPage` | `number` | `0` | 0-indexed current page. **Bindable.** |
| `swipeThreshold` | `number` | `50` | Minimum drag distance (px) to trigger a page change. |
| `slotTransitionDuration` | `number` | `300` | Duration of the page-snap transition in ms. |
| `overscrollResistance` | `number` | `0.3` | Resistance factor at first/last page. `0` = no resistance. |
| `showIndicator` | `boolean` | `true` | Show dot indicator pagination. |
| `globalGestures` | `boolean` | `false` | Capture swipe gestures from the entire document. |
| `touchOnly` | `boolean` | `true` | Only respond to touch input (ignore mouse/pen). |
| `debug` | `boolean` | `false` | Enable debug console logging. |

### Styling

The component exposes scoped CSS classes:

| Class | Element |
|-------|---------|
| `.swipe-viewport` | Outer container with `overflow: hidden` |
| `.swipe-track` | Flex track holding all pages |
| `.swipe-page` | Individual page (100% width flex child) |
| `.swipe-indicator` | Dot indicator container |
| `.swipe-dot` | Individual dot button |
| `.swipe-dot.active` | Active page dot |

To override, increase selector specificity (e.g., `:global(.swipe-dot)`) or wrap the component in your own CSS.

### Interactive element handling

Elements inside swipe pages that should receive clicks/swipes normally (buttons, links, inputs, selects, `[data-swipe-ignore]`) are automatically excluded from swipe initiation.

Horizontal scroll containers inside pages are also detected — swiping over them scrolls the content rather than flipping the page.

## Demo

```sh
git clone <repo>
 cd svelte-virtual-swipe
pnpm install
pnpm build
pnpm dev
```

Opens a SvelteKit app with 4 demo routes: basic, interactive, global gestures, and a 200-page book stress test.

## Browser Support

Pointer Events are required. Supported in all modern browsers:
- Chrome 55+
- Firefox 59+
- Safari 13+
- Edge 79+

IE11 is not supported.

## License

MIT
