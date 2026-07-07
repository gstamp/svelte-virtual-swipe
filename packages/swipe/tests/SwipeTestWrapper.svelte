<script lang="ts">
	import Swipe from '../src/lib/Swipe.svelte';

	let {
		totalPages = 3,
		currentPage = $bindable(0),
		globalGestures = false,
		touchOnly = false,
		swipeInteractiveTargets = '',
		showLocalButton = false,
		showExternalButton = false,
		showSelectableText = false,
		showHorizontalScroller = false
	}: {
		totalPages?: number;
		currentPage?: number;
		globalGestures?: boolean;
		touchOnly?: boolean;
		swipeInteractiveTargets?: string;
		showLocalButton?: boolean;
		showExternalButton?: boolean;
		showSelectableText?: boolean;
		showHorizontalScroller?: boolean;
	} = $props();

	let localButtonClicks = $state(0);
	let externalButtonClicks = $state(0);
</script>

<div data-testid="swipe-wrapper">
	{#if showExternalButton}
		<button
			type="button"
			data-testid="external-control"
			onclick={() => (externalButtonClicks += 1)}
		>
			External clicks: {externalButtonClicks}
		</button>
	{/if}

	<Swipe {totalPages} bind:currentPage {globalGestures} {touchOnly} {swipeInteractiveTargets}>
		{#snippet pageContent(idx)}
			<div class="test-page" data-page={idx}>
				Page {idx + 1}
				{#if showLocalButton && idx === 0}
					<button
						type="button"
						data-testid="local-page-button"
						onclick={() => (localButtonClicks += 1)}
					>
						Local clicks: {localButtonClicks}
					</button>
				{/if}
				{#if showSelectableText && idx === 0}
					<p data-testid="selectable-page-text">Selectable page text for native selection.</p>
				{/if}
				{#if showHorizontalScroller && idx === 0}
					<div
						class="horizontal-scroller"
						data-testid="horizontal-scroller"
						aria-label="Horizontally scrollable page content"
						style="width: 160px; overflow-x: auto; overflow-y: hidden; white-space: nowrap; touch-action: pan-x;"
					>
						<div class="horizontal-scroll-content">
							Wide page content that should scroll horizontally instead of turning the page.
						</div>
					</div>
				{/if}
			</div>
		{/snippet}
	</Swipe>
</div>

<style>
	.horizontal-scroller {
		width: 160px;
		overflow-x: auto;
		overflow-y: hidden;
		white-space: nowrap;
		touch-action: pan-x;
	}

	.horizontal-scroll-content {
		display: inline-block;
		width: 640px;
	}
</style>
