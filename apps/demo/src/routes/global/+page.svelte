<script lang="ts">
	import Swipe from 'svelte-virtual-swipe';

	const pages = [
		{ emoji: '🌊', title: 'Swipe Zone', color: '#4ecdc4', text: 'Swipe inside the card — works like the Basic demo.' },
		{ emoji: '✨', title: 'Global Reach', color: '#45b7d1', text: 'Now swipe outside the card too. The whole page is your gesture surface.' },
		{ emoji: '🖐️', title: 'Anywhere', color: '#96ceb4', text: 'Try swiping on the dark background, the header, or the instruction text.' },
		{ emoji: '🎯', title: 'Same Feel', color: '#ff6b6b', text: 'Same threshold, same overscroll resistance, same page-snap animation.' },
	] as const;

	let currentPage = $state(0);
	let touchOnly = $state(true);
</script>

<svelte:head>
	<title>Global Gestures Demo</title>
</svelte:head>

<div class="demo">
	<header class="top-bar">
		<a href="/" class="back-link">← Home</a>
		<h2>🌐  Global Gestures</h2>
		<span class="page-indicator">Page {currentPage + 1} / {pages.length}</span>
		<button class="mode-toggle" onclick={() => (touchOnly = !touchOnly)}>
			{touchOnly ? '🖐️ Touch only' : '🖱️ Any input'}
		</button>
	</header>

	<p class="instruction">
		Touch anywhere on this page and swipe left/right.
	</p>

	<div class="card-area">
		<Swipe totalPages={pages.length} bind:currentPage showIndicator={true} globalGestures={true} {touchOnly}>
			{#snippet pageContent(idx)}
				<section class="page" style="background: {pages[idx].color}">
					<div class="page-content">
						<span class="page-emoji">{pages[idx].emoji}</span>
						<h3>{pages[idx].title}</h3>
						<p>{pages[idx].text}</p>
					</div>
				</section>
			{/snippet}
		</Swipe>
	</div>

	<div class="swipe-hint">
		<span class="arrow">⬅️</span>
		<span class="hint-text">Swipe anywhere on this page</span>
		<span class="arrow">➡️</span>
	</div>

	<div class="controls-test">
		<p class="controls-label">Click these to navigate — verifies global swipe doesn't break normal click interactions:</p>
		<div class="controls-row">
			<button class="ctrl-btn" onclick={() => { if (currentPage > 0) currentPage--; }}>
				← Prev
			</button>
			<button class="ctrl-btn ctrl-btn-primary" onclick={() => { if (currentPage < pages.length - 1) currentPage++; }}>
				Next →
			</button>
			<label class="ctrl-check">
				<input type="checkbox" checked={false} />
				Check
			</label>
		</div>
	</div>
</div>

<style>
	.demo {
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		color: #e0e0e0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.top-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
		width: 100%;
		max-width: 500px;
		justify-content: space-between;
	}

	.top-bar h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.back-link {
		text-decoration: none;
		color: #e0e0e0;
		font-size: 0.8rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;
		padding: 2px 10px;
		opacity: 0.65;
		transition: opacity 0.2s;
	}

	.back-link:hover {
		opacity: 1;
	}

	.mode-toggle {
		padding: 4px 12px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.08);
		color: #e0e0e0;
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.mode-toggle:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.page-indicator {
		font-size: 0.85rem;
		opacity: 0.6;
		font-variant-numeric: tabular-nums;
	}

	.instruction {
		font-size: 0.95rem;
		opacity: 0.75;
		margin: 0 0 1.5rem;
		text-align: center;
		max-width: 400px;
	}

	.card-area {
		width: 100%;
		max-width: 380px;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 360px;
		width: 100%;
	}

	.page-content {
		text-align: center;
		color: #fff;
		padding: 2rem;
	}

	.page-emoji {
		font-size: 3.5rem;
		display: block;
		margin-bottom: 1rem;
	}

	.page-content h3 {
		font-size: 1.5rem;
		margin: 0 0 0.75rem;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.page-content p {
		font-size: 1rem;
		margin: 0;
		opacity: 0.9;
		line-height: 1.5;
		max-width: 300px;
	}

	.swipe-hint {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 2rem;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		user-select: none;
	}

	.hint-text {
		font-size: 0.85rem;
		opacity: 0.6;
		white-space: nowrap;
	}

	.arrow {
		font-size: 1.2rem;
		opacity: 0.5;
	}

	.controls-test {
		margin-top: 1.5rem;
		text-align: center;
		max-width: 420px;
	}

	.controls-label {
		font-size: 0.85rem;
		opacity: 0.55;
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}

	.controls-row {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		align-items: center;
	}

	.ctrl-btn {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.08);
		color: #e0e0e0;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 0.15s;
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;
}
	.ctrl-btn:active {
		background: rgba(255, 255, 255, 0.18);
	}

	.ctrl-btn-primary {
		background: rgba(78, 205, 196, 0.2);
		border-color: rgba(78, 205, 196, 0.4);
		color: #7ec8e3;
	}


	.ctrl-check {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;
	}

	.ctrl-check input {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}
</style>
