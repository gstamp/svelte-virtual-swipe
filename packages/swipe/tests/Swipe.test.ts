import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, tick } from 'svelte';
import SwipeTestWrapper from './SwipeTestWrapper.svelte';

// ---------------------------------------------------------------------------
// Pointer event helper — dispatches pointerdown → pointermove → pointerup
// ---------------------------------------------------------------------------

async function fireSwipe(
	target: EventTarget,
	fromX: number,
	fromY: number,
	toX: number,
	toY: number,
	pointerId = 1
) {
	target.dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerId,
			pointerType: 'mouse',
			clientX: fromX,
			clientY: fromY,
			bubbles: true,
			cancelable: true,
		})
	);
	target.dispatchEvent(
		new PointerEvent('pointermove', {
			pointerId,
			pointerType: 'mouse',
			clientX: toX,
			clientY: toY,
			bubbles: true,
			cancelable: true,
		})
	);
	target.dispatchEvent(
		new PointerEvent('pointerup', {
			pointerId,
			pointerType: 'mouse',
			clientX: toX,
			clientY: toY,
			bubbles: true,
			cancelable: true,
		})
	);

	// Flush Svelte reactive updates after the gesture
	await tick();
}

const capturedPointers = new Map<number, Element>();
let originalSetPointerCaptureDescriptor: PropertyDescriptor | undefined;
let originalReleasePointerCaptureDescriptor: PropertyDescriptor | undefined;

function installPointerCaptureRetargeting() {
	capturedPointers.clear();
	originalSetPointerCaptureDescriptor = Object.getOwnPropertyDescriptor(
		Element.prototype,
		'setPointerCapture'
	);
	originalReleasePointerCaptureDescriptor = Object.getOwnPropertyDescriptor(
		Element.prototype,
		'releasePointerCapture'
	);

	Object.defineProperty(Element.prototype, 'setPointerCapture', {
		configurable: true,
		value(this: Element, pointerId: number) {
			capturedPointers.set(pointerId, this);
		},
	});
	Object.defineProperty(Element.prototype, 'releasePointerCapture', {
		configurable: true,
		value(this: Element, pointerId: number) {
			if (capturedPointers.get(pointerId) === this) capturedPointers.delete(pointerId);
		},
	});
}

function restorePointerCaptureRetargeting() {
	capturedPointers.clear();
	if (originalSetPointerCaptureDescriptor) {
		Object.defineProperty(Element.prototype, 'setPointerCapture', originalSetPointerCaptureDescriptor);
	} else {
		Reflect.deleteProperty(Element.prototype, 'setPointerCapture');
	}
	if (originalReleasePointerCaptureDescriptor) {
		Object.defineProperty(
			Element.prototype,
			'releasePointerCapture',
			originalReleasePointerCaptureDescriptor
		);
	} else {
		Reflect.deleteProperty(Element.prototype, 'releasePointerCapture');
	}
}

async function firePointerClick(target: HTMLElement, pointerId = 101) {
	capturedPointers.delete(pointerId);
	target.dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerId,
			pointerType: 'mouse',
			clientX: 20,
			clientY: 20,
			bubbles: true,
			cancelable: true,
		})
	);

	const capturedTarget = capturedPointers.get(pointerId);
	const pointerUpTarget = capturedTarget ?? target;
	pointerUpTarget.dispatchEvent(
		new PointerEvent('pointerup', {
			pointerId,
			pointerType: 'mouse',
			clientX: 20,
			clientY: 20,
			bubbles: true,
			cancelable: true,
		})
	);

	(capturedTarget ?? target).dispatchEvent(
		new MouseEvent('click', {
			clientX: 20,
			clientY: 20,
			bubbles: true,
			cancelable: true,
		})
	);

	await tick();
}

function dispatchPointerEvent(
	target: EventTarget,
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	clientX: number,
	clientY: number,
	pointerId = 1
) {
	const event = new PointerEvent(type, {
		pointerId,
		pointerType: 'mouse',
		clientX,
		clientY,
		bubbles: true,
		cancelable: true,
	});
	target.dispatchEvent(event);
	return event;
}

function fireSelectStart(target: EventTarget) {
	const event = new Event('selectstart', { bubbles: true, cancelable: true });
	return {
		dispatched: target.dispatchEvent(event),
		defaultPrevented: event.defaultPrevented,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function activeDotIndex(): number {
	const dots = document.querySelectorAll<HTMLButtonElement>('.swipe-dot');
	return Array.from(dots).findIndex((d) => d.classList.contains('active'));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Swipe', () => {
	beforeEach(() => {
		// Ensure PointerEvent is available (happy-dom provides it)
		// and set a minimal viewport size for layout calculations
		Object.defineProperty(document.documentElement, 'clientWidth', {
			value: 400,
			configurable: true,
		});
		installPointerCaptureRetargeting();
	});

	afterEach(() => {
		restorePointerCaptureRetargeting();
		document.body.innerHTML = '';
	});

	// -----------------------------------------------------------------------
	// Local gestures (default behavior — swipe on the viewport element)
	// -----------------------------------------------------------------------

	describe('local gestures', () => {
		it('swipes left (←) to advance to the next page', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3 },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(1);
		});

		it('leaves horizontal scrollable page content in control of horizontal drags', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, showHorizontalScroller: true },
			});
			await tick();

			const scroller = document.querySelector<HTMLElement>('[data-testid="horizontal-scroller"]')!;
			Object.defineProperties(scroller, {
				clientWidth: { value: 160, configurable: true },
				scrollWidth: { value: 640, configurable: true },
			});
			const pointerId = 303;

			dispatchPointerEvent(scroller, 'pointerdown', 200, 100, pointerId);
			const move = dispatchPointerEvent(scroller, 'pointermove', 50, 100, pointerId);
			dispatchPointerEvent(scroller, 'pointerup', 50, 100, pointerId);
			await tick();

			expect(move.defaultPrevented).toBe(false);
			expect(activeDotIndex()).toBe(0);

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 200, 100, 50, 100, pointerId + 1);

			expect(activeDotIndex()).toBe(1);
		});

		it('keeps a page button clickable in mouse mode while viewport swipes still work', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, touchOnly: false, showLocalButton: true },
			});
			await tick();

			const button = document.querySelector<HTMLButtonElement>('[data-testid="local-page-button"]')!;
			await firePointerClick(button);

			expect(button.textContent).toContain('Local clicks: 1');

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(1);
		});

		it('swipes right (→) to go back to the previous page', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, currentPage: 1 },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 50, 100, 200, 100);

			expect(activeDotIndex()).toBe(0);
		});

		it('does not go below page 0 on right swipe at first page', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, currentPage: 0 },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 50, 100, 200, 100);

			expect(activeDotIndex()).toBe(0);
		});

		it('does not go past the last page on left swipe at last page', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, currentPage: 2 },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(2);
		});

		it('does not advance on a short swipe below the threshold', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, currentPage: 0 },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			// Only 30px — default threshold is 50
			await fireSwipe(viewport, 200, 100, 170, 100);

			expect(activeDotIndex()).toBe(0);
		});

		it('does not treat a vertical drag as a swipe', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, currentPage: 0 },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 100, 100, 105, 300);

			expect(activeDotIndex()).toBe(0);
		});

		it('allows native text selection during a primarily vertical drag', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, currentPage: 0, showSelectableText: true },
			});
			await tick();

			const selectableText = document.querySelector<HTMLElement>(
				'[data-testid="selectable-page-text"]'
			)!;
			const pointerId = 202;
			dispatchPointerEvent(selectableText, 'pointerdown', 100, 100, pointerId);
			dispatchPointerEvent(selectableText, 'pointermove', 104, 220, pointerId);

			try {
				expect(fireSelectStart(selectableText)).toEqual({
					dispatched: true,
					defaultPrevented: false,
				});
				expect(activeDotIndex()).toBe(0);
			} finally {
				dispatchPointerEvent(selectableText, 'pointerup', 104, 220, pointerId);
				await tick();
			}
		});

		it('does not globally disable user selection on selectable page text', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, showSelectableText: true },
			});
			await tick();

			const selectableText = document.querySelector<HTMLElement>(
				'[data-testid="selectable-page-text"]'
			)!;

			expect(window.getComputedStyle(selectableText).userSelect).not.toBe('none');
		});

		it('keeps selectable page text out of touch-action none so native selection can start', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, showSelectableText: true },
			});
			await tick();

			const selectableText = document.querySelector<HTMLElement>(
				'[data-testid="selectable-page-text"]'
			)!;
			const touchActionElements = [
				selectableText,
				selectableText.closest<HTMLElement>('.swipe-page')!,
				selectableText.closest<HTMLElement>('.swipe-track')!,
				selectableText.closest<HTMLElement>('.swipe-viewport')!,
			];

			for (const element of touchActionElements) {
				expect(window.getComputedStyle(element).touchAction).not.toBe('none');
			}
		});
	});

	// -----------------------------------------------------------------------
	// Global gestures (globalGestures prop)
	// -----------------------------------------------------------------------

	describe('global gestures', () => {
		it('swipes outside the viewport when enabled', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, globalGestures: true },
			});
			await tick();

			await fireSwipe(document.body, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(1);
		});

		it('keeps an external control clickable in mouse mode while global swipes remain enabled', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: {
					totalPages: 3,
					globalGestures: true,
					touchOnly: false,
					showExternalButton: true,
				},
			});
			await tick();

			const button = document.querySelector<HTMLButtonElement>('[data-testid="external-control"]')!;
			await firePointerClick(button);

			expect(button.textContent).toContain('External clicks: 1');

			await fireSwipe(document.body, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(1);
		});

		it('ignores outside swipes when disabled (default)', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3 },
			});
			await tick();

			await fireSwipe(document.body, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(0);
		});

		it('still handles swipes inside the viewport when globalGestures is on', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, globalGestures: true },
			});
			await tick();

			const viewport = document.querySelector<HTMLElement>('.swipe-viewport')!;
			await fireSwipe(viewport, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(1);
		});

		it('applies overscroll resistance at edges for global swipes', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, globalGestures: true, currentPage: 0 },
			});
			await tick();

			await fireSwipe(document.body, 50, 100, 200, 100);

			expect(activeDotIndex()).toBe(0);
		});
	});

	// -----------------------------------------------------------------------
	// swipeInteractiveTargets
	// -----------------------------------------------------------------------

	describe('swipeInteractiveTargets', () => {
		it('default behavior still ignores interactive targets like role="button"', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: { totalPages: 3, touchOnly: false },
			});
			await tick();

			const target = document.querySelector<HTMLElement>('.test-page')!;
			target.setAttribute('role', 'button');

			await fireSwipe(target, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(0);
		});

		it('allowed interactive target can start swipe', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: {
					totalPages: 3,
					touchOnly: false,
					swipeInteractiveTargets: '[data-reader-word-trigger="true"]',
				},
			});
			await tick();

			const target = document.querySelector<HTMLElement>('.test-page')!;
			target.setAttribute('role', 'button');
			target.setAttribute('data-reader-word-trigger', 'true');

			await fireSwipe(target, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(1);
		});

		it('tap on allowed interactive target is not blocked', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: {
					totalPages: 3,
					touchOnly: false,
					swipeInteractiveTargets: '[data-reader-word-trigger="true"]',
				},
			});
			await tick();

			const target = document.querySelector<HTMLElement>('.test-page')!;
			target.setAttribute('role', 'button');
			target.setAttribute('data-reader-word-trigger', 'true');

			let clickCount = 0;
			target.addEventListener('click', () => { clickCount++; });

			// Tap: pointerdown + pointerup (no horizontal move)
			dispatchPointerEvent(target, 'pointerdown', 15, 15);
			dispatchPointerEvent(target, 'pointerup', 15, 15);
			await tick();

			// Dispatch click
			target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			await tick();

			expect(clickCount).toBe(1);
			expect(activeDotIndex()).toBe(0);
		});

		it('swipe on allowed interactive target blocks follow-up click', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: {
					totalPages: 3,
					touchOnly: false,
					swipeInteractiveTargets: '[data-reader-word-trigger="true"]',
				},
			});
			await tick();

			const target = document.querySelector<HTMLElement>('.test-page')!;
			target.setAttribute('role', 'button');
			target.setAttribute('data-reader-word-trigger', 'true');

			let clickCount = 0;
			target.addEventListener('click', () => { clickCount++; });

			await fireSwipe(target, 200, 100, 50, 100);

			// Dispatch click after swipe — should be blocked
			target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			await tick();

			expect(activeDotIndex()).toBe(1);
			expect(clickCount).toBe(0);
		});

		it('data-swipe-ignore wins over swipeInteractiveTargets', async () => {
			mount(SwipeTestWrapper, {
				target: document.body,
				props: {
					totalPages: 3,
					touchOnly: false,
					swipeInteractiveTargets: '[data-reader-word-trigger="true"]',
				},
			});
			await tick();

			const target = document.querySelector<HTMLElement>('.test-page')!;
			target.setAttribute('role', 'button');
			target.setAttribute('data-reader-word-trigger', 'true');
			target.setAttribute('data-swipe-ignore', '');

			await fireSwipe(target, 200, 100, 50, 100);

			expect(activeDotIndex()).toBe(0);
		});
	});
});
