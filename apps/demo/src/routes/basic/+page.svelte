<script lang="ts">
	import Swipe from 'svelte-swipe';

	const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'] as const;
	const labels = ['Coral', 'Teal', 'Blue', 'Sage'] as const;
	const descriptions = [
		'Warm and vibrant — the coral wave.',
		'Cool and calm — the teal tide.',
		'Deep and clear — the blue current.',
		'Soft and natural — the sage breeze.'
	] as const;
	const totalPages = colors.length;
	let currentPage = $state(0);
	let touchOnly = $state(true);
</script>

<svelte:head>
	<title>Basic Swipe Demo</title>
</svelte:head>

<div class="demo">
	<button class="mode-toggle" onclick={() => (touchOnly = !touchOnly)}>
		{touchOnly ? '🖐️ Touch only' : '🖱️ Any input'}
	</button>

	<a href="/" class="back-link">&larr; Home</a>

	<Swipe {totalPages} bind:currentPage showIndicator={true} {touchOnly}>
		{#snippet pageContent(idx: number)}
			<section class="page" style="background: {colors[idx]}">
				<div class="page-content">
					<h1>{labels[idx]}</h1>
					<p>{descriptions[idx]}</p>
					<span class="page-num">Page {idx + 1} of {totalPages}</span>
				</div>
			</section>
		{/snippet}
	</Swipe>
</div>


<style>
	.demo {
		height: 100vh;
		width: 100%;
		position: relative;
	}

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

	.mode-toggle:hover {
		background: rgba(0, 0, 0, 0.6);
	}

	.page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		width: 100%;
	}

	.page-content {
		text-align: center;
		color: #fff;
		padding: 2rem;
	}

	.page-content h1 {
		font-size: 3rem;
		margin: 0 0 0.5rem;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.page-content p {
		font-size: 1.25rem;
		margin: 0 0 1.5rem;
		opacity: 0.9;
		max-width: 400px;
	}

	.page-num {
		font-size: 0.875rem;
		opacity: 0.7;
		letter-spacing: 0.05em;
	}
</style>
