<script lang="ts">
	import Swipe from 'svelte-virtual-swipe';

	let currentPage = $state(0);
	let touchOnly = $state(true);

	// Per-page interaction tracking
	type PageStatus = { type: 'tap' | 'swipe'; label: string };
	let pageStatus = $state<Record<number, PageStatus>>({});

	// Detect page changes and mark as swipe (unless already marked tap)
	$effect(() => {
		const idx = currentPage;
		queueMicrotask(() => {
			if (!pageStatus[idx] || pageStatus[idx].type !== 'tap') {
				pageStatus[idx] = { type: 'swipe', label: 'Swiped here' };
			}
		});
	});

	function recordTap(idx: number, label: string) {
		pageStatus[idx] = { type: 'tap', label };
	}

	function statusBadge(idx: number) {
		const s = pageStatus[idx];
		if (!s) return 'Tap or swipe';
		return s.type === 'tap' ? `Tap: ${s.label}` : `Swipe: ${s.label}`;
	}

	function statusColor(idx: number) {
		const s = pageStatus[idx];
		if (!s) return 'transparent';
		return s.type === 'tap' ? '#22c55e' : '#f59e0b';
	}

	// --- Page state ---
	let counterValue = $state(0);
	let toggleOn = $state(false);
	let selectedCard = $state<number | null>(null);
	let inputValue = $state('');
</script>

<svelte:head>
	<title>Interactive Swipe Demo</title>
</svelte:head>

<div class="demo">
	<a href="/" class="back-link">← Home</a>
	<button class="mode-toggle" onclick={() => (touchOnly = !touchOnly)}>
		{touchOnly ? '🖐️ Touch only' : '🖱️ Any input'}
	</button>
	<Swipe totalPages={4} bind:currentPage showIndicator={true} swipeThreshold={50} {touchOnly}>
		{#snippet pageContent(idx: number)}
			<section class="page interactive">
				{#if idx === 0}
					<div class="card">
						<div class="badge" style="background: {statusColor(idx)}">
							{statusBadge(idx)}
						</div>
						<h2>Counter</h2>
						<p class="counter-value">{counterValue}</p>
						<div class="button-row">
							<button
								class="btn"
								onclick={() => { counterValue--; recordTap(idx, 'Decrement'); }}
							>-</button>
							<button
								class="btn"
								onclick={() => { counterValue++; recordTap(idx, 'Increment'); }}
							>+</button>
						</div>
					</div>
				{:else if idx === 1}
					<div class="card">
						<div class="badge" style="background: {statusColor(idx)}">
							{statusBadge(idx)}
						</div>
						<h2>Toggle Switch</h2>
						<button
							class="toggle"
							class:active={toggleOn}
							role="switch"
							aria-checked={toggleOn}
							aria-label="Toggle switch"
							onclick={() => { toggleOn = !toggleOn; recordTap(idx, toggleOn ? 'On' : 'Off'); }}
						>
							<span class="toggle-knob"></span>
						</button>
						<p>{toggleOn ? 'ON' : 'OFF'}</p>
					</div>
				{:else if idx === 2}
					<div class="card">
						<div class="badge" style="background: {statusColor(idx)}">
							{statusBadge(idx)}
						</div>
						<h2>Pick a card</h2>
						<div class="card-list">
							{#each ['Alpha', 'Beta', 'Gamma'] as name, i}
								<button
									class="card-item"
									class:selected={selectedCard === i}
									onclick={() => { selectedCard = i; recordTap(idx, name); }}
								>
									{name}
								</button>
							{/each}
						</div>
						<p class="hint">{selectedCard !== null ? `Selected: ${['Alpha', 'Beta', 'Gamma'][selectedCard]}` : 'Tap a card'}</p>
					</div>
				{:else if idx === 3}
					<div class="card">
						<div class="badge" style="background: {statusColor(idx)}">
							{statusBadge(idx)}
						</div>
						<h2>Text Input</h2>
						<input
							type="text"
							placeholder="Type something..."
							bind:value={inputValue}
							onfocus={() => recordTap(idx, 'Input focused')}
						/>
						<p class="hint">{inputValue ? `You typed: ${inputValue}` : 'Tap the input to focus'}</p>
					</div>
				{/if}
			</section>
		{/snippet}
	</Swipe>
</div>

<style>

	.mode-toggle {
		position: absolute;
		top: 16px;
		right: 16px;
		z-index: 10;
		padding: 6px 14px;
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(0, 0, 0, 0.4);
		color: #fff;
		font-size: 0.8rem;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition: background 0.2s;
	}

	.mode-toggle:hover {
		background: rgba(0, 0, 0, 0.6);
	}
.back-link {
	position: absolute;
	top: 16px;
	left: 16px;
	z-index: 10;
	padding: 6px 14px;
	border-radius: 20px;
	border: 1px solid rgba(255, 255, 255, 0.3);
	background: rgba(0, 0, 0, 0.4);
	color: #fff;
	font-size: 0.8rem;
	text-decoration: none;
	backdrop-filter: blur(4px);
	transition: background 0.2s;
}

.back-link:hover {
	background: rgba(0, 0, 0, 0.6);
}

.demo {
	height: 100vh;
	width: 100%;
	position: relative;
}

	.page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		width: 100%;
		background: #1a1a2e;
	}

	.card {
		background: #16213e;
		border-radius: 16px;
		padding: 2rem;
		text-align: center;
		color: #e0e0e0;
		min-width: 280px;
		max-width: 360px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		position: relative;
	}

	.card h2 {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		color: #fff;
	}

	.badge {
		position: absolute;
		top: -10px;
		right: -10px;
		font-size: 0.7rem;
		padding: 4px 10px;
		border-radius: 12px;
		color: #fff;
		font-weight: 600;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.counter-value {
		font-size: 3rem;
		font-weight: 700;
		margin: 0 0 1rem;
		color: #fff;
	}

	.button-row {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.btn {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2px solid #0f3460;
		background: #0f3460;
		color: #fff;
		font-size: 1.5rem;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn:hover {
		background: #1a4a7a;
		border-color: #1a4a7a;
	}

	.toggle {
		width: 60px;
		height: 30px;
		border-radius: 15px;
		border: none;
		background: #333;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		padding: 0;
	}

	.toggle.active {
		background: #22c55e;
	}

	.toggle-knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.2s;
	}

	.toggle.active .toggle-knob {
		transform: translateX(30px);
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.card-item {
		padding: 12px;
		border-radius: 8px;
		border: 2px solid #0f3460;
		background: transparent;
		color: #e0e0e0;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s, border-color 0.2s;
	}

	.card-item:hover {
		background: #0f3460;
	}

	.card-item.selected {
		background: #0f3460;
		border-color: #22c55e;
		color: #fff;
	}

	input[type='text'] {
		width: 100%;
		padding: 12px;
		border-radius: 8px;
		border: 2px solid #0f3460;
		background: #0a0a1a;
		color: #fff;
		font-size: 1rem;
		box-sizing: border-box;
		outline: none;
		transition: border-color 0.2s;
	}

	input[type='text']:focus {
		border-color: #22c55e;
	}

	.hint {
		font-size: 0.875rem;
		opacity: 0.6;
		margin-top: 0.75rem;
	}
</style>
