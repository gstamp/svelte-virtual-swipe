<script lang="ts">
	import type { SwipeProps } from './types';

	let {
		pageContent,
		totalPages,
		currentPage = $bindable(0),
		swipeThreshold = 50,
		slotTransitionDuration = 300,
		overscrollResistance = 0.3,
		showIndicator = true,
		globalGestures = false,
		touchOnly = true,
		debug = false,
		swipeInteractiveTargets = ''
	}: SwipeProps = $props();

	// ── SSR guard ──────────────────────────────────────────────
	let viewportEl: HTMLDivElement | undefined = $state();
	let hasWindow = $derived(typeof window !== 'undefined' && typeof PointerEvent !== 'undefined');

	// ── Pointer tracking state ──────────────────────────────────
	let startX = $state(0);
	let startY = $state(0);
	let dragOffset = $state(0);
	let initialDragOffset = $state(0);
	let isDragging = $state(false);
	let isSwiping = $state(false);
	let justSwiped = $state(false);
	let pointerId: number | null = $state(null);

	// Global gesture state
	let globalActive = $state(false);
	let globalStartX = $state(0);
	let globalStartY = $state(0);
	let globalInitialDragOffset = $state(0);
	let globalPointerId: number | null = $state(null);

	// ── Selection guard (only active after a swipe is recognized) ──
	let selectionGuard: (() => void) | null = null;

	function enableSelectionGuard() {
		if (selectionGuard) return;
		const handler = (e: Event) => e.preventDefault();
		document.addEventListener('selectstart', handler, { passive: false });
		selectionGuard = () => document.removeEventListener('selectstart', handler);
	}

	function disableSelectionGuard() {
		selectionGuard?.();
		selectionGuard = null;
	}

	function clearTextSelection() {
		window.getSelection()?.removeAllRanges();
	}

	function claimLocalSwipe(pointerId: number) {
		try { viewportEl?.setPointerCapture(pointerId); } catch { /* not supported */ }
		enableSelectionGuard();
		clearTextSelection();
	}

	function claimGlobalSwipe(pointerId: number) {
		try { document.documentElement.setPointerCapture(pointerId); } catch { /* not supported */ }
		enableSelectionGuard();
		clearTextSelection();
	}

	const interactiveSelector = [
		'button',
		'a[href]',
		'input',
		'textarea',
		'select',
		'label',
		'summary',
		'[contenteditable]:not([contenteditable="false"])',
		'[role="button"]',
		'[role="checkbox"]',
		'[role="combobox"]',
		'[role="link"]',
		'[role="listbox"]',
		'[role="menuitem"]',
		'[role="option"]',
		'[role="radio"]',
		'[role="slider"]',
		'[role="spinbutton"]',
		'[role="switch"]',
		'[role="tab"]',
	].join(',');
	function isAllowedInteractiveSwipeTarget(target: EventTarget | null): boolean {
		if (!swipeInteractiveTargets) return false;
		return target instanceof Element && target.closest(swipeInteractiveTargets) !== null;
	}

	function isInteractiveTarget(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		if (target.closest('[data-swipe-ignore]')) return true;
		if (isAllowedInteractiveSwipeTarget(target)) return false;
		return target.closest(interactiveSelector) !== null;
	}
	function isHorizontallyScrollable(element: Element): boolean {
		if (!(element instanceof HTMLElement)) return false;
		const style = window.getComputedStyle(element);
		if (!['auto', 'scroll', 'overlay'].includes(style.overflowX)) return false;
		return element.scrollWidth > element.clientWidth + 1;
	}

	function hasHorizontalScroller(target: EventTarget | null, boundary?: Element): boolean {
		let element = target instanceof Element ? target : null;
		while (element && element !== boundary) {
			if (isHorizontallyScrollable(element)) return true;
			element = element.parentElement;
		}
		return false;
	}

	// ── Animation commit double-buffer ──────────────────────────
	let committedPage = $state(currentPage);
	let suppressTransition = $state(false);

	// ── Derived slot window ─────────────────────────────────────
	let slotVisibleStart = $derived(Math.max(0, committedPage - 1));
	let slotVisibleEnd = $derived(Math.min(totalPages - 1, committedPage + 1));
	let slotPrevIdx = $derived(slotVisibleStart >= committedPage ? -1 : committedPage - 1);
	let slotCurrentIdx = $derived(committedPage);
	let slotNextIdx = $derived(slotVisibleEnd <= committedPage ? -1 : committedPage + 1);

	// Clamp currentPage
	$effect(() => {
		if (currentPage >= totalPages) {
			currentPage = Math.max(0, totalPages - 1);
		}
	});

	// ── Transform & transition ──────────────────────────────────
	let transform = $derived.by(() => {
		const slotIdx = currentPage - committedPage;
		const basePct = -(slotVisibleStart + 1 + slotIdx) * 100;
		const offsetPx = isDragging ? dragOffset : 0;
		return `translateX(calc(${basePct}% + ${offsetPx}px))`;
	});

	let transition = $derived(
		isDragging || suppressTransition
			? 'none'
			: `transform ${slotTransitionDuration}ms ease-out`
	);

	function onTransitionEnd(e: TransitionEvent) {
		if (e.propertyName !== 'transform') return;
		if (committedPage !== currentPage) {
			suppressTransition = true;
			committedPage = currentPage;
			// Double rAF: first paints transition:none + new layout,
			// second safely re-enables transitions without coalescing
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					suppressTransition = false;
				});
			});
		}
	}

	// ── Position capture (for mid-animation touch start) ────────
	function capturePosition(): number {
		const track = document.querySelector('.swipe-track');
		if (!track) return 0;
		const style = window.getComputedStyle(track);
		const matrix = style.transform;
		if (matrix === 'none') return 0;
		const m = new DOMMatrixReadOnly(matrix);
		const tx = m.m41;
		const vpWidth = track.parentElement?.clientWidth ?? 0;
		if (vpWidth <= 0) return 0;
		const basePx = (-(slotVisibleStart + 1 + (currentPage - committedPage))) * vpWidth;
		return tx - basePx;
	}

	// ── Pointer event handlers ──────────────────────────────────
	function handlePointerDown(e: PointerEvent) {
		if (touchOnly && e.pointerType !== 'touch') return;
		if (isInteractiveTarget(e.target) || hasHorizontalScroller(e.target, viewportEl)) return;
		if (pointerId !== null) return;

		startX = e.clientX;
		startY = e.clientY;
		isSwiping = false;
		justSwiped = false;
		pointerId = e.pointerId;
		isDragging = true;
		initialDragOffset = capturePosition();
		dragOffset = initialDragOffset;
		if (debug) log('pointerdown', { x: startX, y: startY });
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || e.pointerId !== pointerId) return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (!isSwiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
			isSwiping = true;
			claimLocalSwipe(e.pointerId);
			if (debug) log('swipe detected', { dx, dy });
		}

		if (isSwiping) {
			e.preventDefault();
			const r = overscrollResistance;
			if (currentPage === 0 && dx > 0) {
				dragOffset = initialDragOffset + dx * r;
			} else if (currentPage === totalPages - 1 && dx < 0) {
				dragOffset = initialDragOffset + dx * r;
			} else {
				dragOffset = initialDragOffset + dx;
			}
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging || e.pointerId !== pointerId) return;

		isDragging = false;
		pointerId = null;
		try { viewportEl?.releasePointerCapture(e.pointerId); } catch { /* already released */ }

		if (isSwiping) {
			const dx = e.clientX - startX;
			if (debug) log('pointerup', { dx, threshold: swipeThreshold });

			if (dx < -swipeThreshold && currentPage < totalPages - 1) {
				currentPage++;
			} else if (dx > swipeThreshold && currentPage > 0) {
				currentPage--;
			}
			blockNextClick();
		}

		dragOffset = 0;
		disableSelectionGuard();
		isSwiping = false;
	}

	function handlePointerCancel(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;
		if (debug) log('pointercancel', {});
		isDragging = false;
		pointerId = null;
		dragOffset = 0;
		isSwiping = false;
		try { viewportEl?.releasePointerCapture(e.pointerId); } catch { /* already released */ }
		disableSelectionGuard();
	}

	// ── Click blocker (prevents click after swipe) ─────────────
	function blockNextClick(scope: 'viewport' | 'document' = 'viewport') {
		justSwiped = true;
		const handler = (e: MouseEvent) => {
			// If the component has been unmounted, clean up without blocking.
			if (!viewportEl?.isConnected) {
				document.removeEventListener('click', handler, true);
				justSwiped = false;
				return;
			}
			if (scope === 'document' || viewportEl?.contains(e.target as Node)) {
				e.stopPropagation();
				e.preventDefault();
			}
			document.removeEventListener('click', handler, true);
			justSwiped = false;
		};
		document.addEventListener('click', handler, true);
		setTimeout(() => {
			document.removeEventListener('click', handler, true);
			justSwiped = false;
		}, 600);
	}

	// ── Register pointermove (non-passive for preventDefault) ──
	$effect(() => {
		const el = viewportEl;
		if (!el) return;
		const handler = (e: PointerEvent) => handlePointerMove(e);
		el.addEventListener('pointermove', handler, { passive: false });
		return () => el.removeEventListener('pointermove', handler);
	});

	// ── Global gestures ────────────────────────────────────────
	$effect(() => {
		if (!globalGestures || !hasWindow) return;

		const onDown = (e: PointerEvent) => {
			if (viewportEl?.contains(e.target as Node)) return;
			if (globalPointerId !== null) return;
			if (touchOnly && e.pointerType !== 'touch') return;
			if (isInteractiveTarget(e.target) || hasHorizontalScroller(e.target)) return;

			globalActive = true;
			globalPointerId = e.pointerId;
			globalStartX = e.clientX;
			globalStartY = e.clientY;
			isSwiping = false;
			justSwiped = false;
			isDragging = true;
			globalInitialDragOffset = capturePosition();
			dragOffset = globalInitialDragOffset;
		};

		const onMove = (e: PointerEvent) => {
			if (!globalActive || e.pointerId !== globalPointerId) return;
			const dx = e.clientX - globalStartX;
			const dy = e.clientY - globalStartY;

			if (!isSwiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
				isSwiping = true;
				claimGlobalSwipe(e.pointerId);
			}

			if (isSwiping) {
				e.preventDefault();
				const r = overscrollResistance;
				if (currentPage === 0 && dx > 0) {
					dragOffset = globalInitialDragOffset + dx * r;
				} else if (currentPage === totalPages - 1 && dx < 0) {
					dragOffset = globalInitialDragOffset + dx * r;
				} else {
					dragOffset = globalInitialDragOffset + dx;
				}
			}
		};

		const onUp = (e: PointerEvent) => {
			if (!globalActive || e.pointerId !== globalPointerId) return;
			globalActive = false;
			globalPointerId = null;
			isDragging = false;

			try { document.documentElement.releasePointerCapture(e.pointerId); } catch { /* ok */ }
			disableSelectionGuard();

			if (isSwiping) {
				const dx = e.clientX - globalStartX;
				if (dx < -swipeThreshold && currentPage < totalPages - 1) {
					currentPage++;
				} else if (dx > swipeThreshold && currentPage > 0) {
					currentPage--;
				}
				blockNextClick('document');
			}

			dragOffset = 0;
			isSwiping = false;
		};

		const onCancel = (e: PointerEvent) => {
			if (e.pointerId !== globalPointerId) return;
			globalActive = false;
			globalPointerId = null;
			isDragging = false;
			dragOffset = 0;
			isSwiping = false;
			try { document.documentElement.releasePointerCapture(e.pointerId); } catch { /* ok */ }
			disableSelectionGuard();
		};

		document.addEventListener('pointerdown', onDown);
		document.addEventListener('pointermove', onMove, { passive: false });
		document.addEventListener('pointerup', onUp);
		document.addEventListener('pointercancel', onCancel);

		return () => {
			document.removeEventListener('pointerdown', onDown);
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			document.removeEventListener('pointercancel', onCancel);
		};
	});

	// ── ResizeObserver (scale dragOffset during resize) ─────────
	$effect(() => {
		const el = viewportEl;
		if (!el) return;

		let lastWidth = el.clientWidth;
		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			const newWidth = entry.contentRect.width;
			if (isDragging && lastWidth > 0 && newWidth > 0) {
				dragOffset *= newWidth / lastWidth;
			}
			lastWidth = newWidth;
		});

		ro.observe(el);
		return () => ro.disconnect();
	});

	function log(event: string, data: Record<string, unknown>) {
		console.log(`[Swipe] ${event}`, data);
	}
</script>

{#if !hasWindow}
	<div class="swipe-static">
		{@render pageContent(currentPage)}
	</div>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="swipe-viewport"
		bind:this={viewportEl}
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerCancel}
	>
		<div
			class="swipe-track"
			style="transform: {transform}; transition: {transition}"
			ontransitionend={onTransitionEnd}
		>
			<div style="flex: 0 0 calc({slotVisibleStart} * 100%)"></div>
			<div class="swipe-page">
				{#if slotPrevIdx >= 0}
					{@render pageContent(slotPrevIdx)}
				{/if}
			</div>
			<div class="swipe-page">
				{@render pageContent(slotCurrentIdx)}
			</div>
			<div class="swipe-page">
				{#if slotNextIdx >= 0}
					{@render pageContent(slotNextIdx)}
				{/if}
			</div>
			<div style="flex: 0 0 calc({totalPages - 1 - slotVisibleEnd} * 100%)"></div>
		</div>
		{#if showIndicator}
			<div class="swipe-indicator" role="tablist" aria-label="Page navigation">
				{#each Array.from({ length: totalPages }) as _, i}
					<button
						class="swipe-dot"
						class:active={i === currentPage}
						role="tab"
						aria-label="Go to page {i + 1}"
						aria-selected={i === currentPage}
						onclick={() => (currentPage = i)}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.swipe-static {
		width: 100%;
	}

	.swipe-viewport {
		overflow: hidden;
		touch-action: pan-y;
		position: relative;
		width: 100%;
		height: 100%;
		outline: none;
	}

	.swipe-track {
		display: flex;
		align-items: stretch;
		touch-action: pan-y;
		will-change: transform;
		width: 100%;
		height: 100%;
	}

	.swipe-page {
		flex: 0 0 100%;
		min-width: 0;
		touch-action: pan-y;
		width: 100%;
		height: 100%;
	}

	.swipe-indicator {
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: 8px;
		padding: 16px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.swipe-indicator .swipe-dot {
		pointer-events: auto;
	}

	.swipe-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0;
		transition: background 0.2s;
	}

	.swipe-dot.active {
		background: rgba(255, 255, 255, 0.95);
	}

	.swipe-dot:hover {
		background: rgba(255, 255, 255, 0.75);
	}
</style>
