import type { Snippet } from 'svelte';

export type SwipeProps = {
	/** Snippet that renders page content for a given index (0-based). */
	pageContent: Snippet<[number]>;
	/** Total number of pages. */
	totalPages: number;
	/** 0-indexed current page — bindable. */
	currentPage?: number;
	/** Minimum drag distance (px) to trigger a page change. Default 50. */
	swipeThreshold?: number;
	/** Duration of the page-snap transition in ms. Default 300. */
	slotTransitionDuration?: number;
	/** Resistance factor for overscroll at first/last page. 0 = no resistance. Default 0.3. */
	overscrollResistance?: number;
	/** Show dot indicator. Default true. */
	showIndicator?: boolean;
	/** Capture swipe gestures from the entire document. Default false. */
	globalGestures?: boolean;
	/** Only respond to touch input (ignore mouse/pen). Default true. */
	touchOnly?: boolean;
	/** Enable debug console logging. Default false. */
	debug?: boolean;
	/**
	 * CSS selector for interactive descendants that should be allowed to start a swipe.
	 *
	 * By default, interactive descendants such as buttons, links, inputs, and role="button"
	 * are ignored so normal controls keep working. Use this only for controls where a
	 * horizontal drag should page-swipe while a tap/click should still activate the control.
	 *
	 * Example: `'[data-reader-word-trigger="true"]'`
	 */
	swipeInteractiveTargets?: string;
};
