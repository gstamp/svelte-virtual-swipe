<script lang="ts">
	import Swipe from 'svelte-swipe';

	const TOTAL_PAGES = 200;
	let currentPage = $state(0);
	let touchOnly = $state(true);

	// Deterministic pseudo-random based on page index
	// Generates reproducible text so it doesn't need pre-generation
	const WORDS = [
		'the', 'a', 'an', 'this', 'that', 'these', 'those',
		'and', 'or', 'but', 'yet', 'so', 'for', 'nor',
		'was', 'were', 'been', 'being', 'have', 'has', 'had',
		'could', 'would', 'should', 'might', 'must', 'shall',
		'about', 'across', 'after', 'along', 'among', 'around',
		'before', 'behind', 'below', 'beneath', 'beside', 'between',
		'beyond', 'during', 'except', 'inside', 'outside', 'under',
		'above', 'against', 'through', 'toward', 'within', 'without',
		'ancient', 'vast', 'silent', 'golden', 'crimson', 'fading',
		'endless', 'broken', 'distant', 'hollow', 'wandering', 'forgotten',
		'gathered', 'scattered', 'whispered', 'echoed', 'drifted', 'crumbled',
		'journey', 'shadow', 'memory', 'horizon', 'garden', 'harbor',
		'kingdom', 'forest', 'castle', 'village', 'mountain', 'river',
		'bridge', 'tower', 'gateway', 'temple', 'market', 'tavern',
		'letter', 'story', 'secret', 'legend', 'dream', 'mirror',
		'candle', 'lantern', 'compass', 'dagger', 'crown', 'ribbon',
		'silver', 'copper', 'iron', 'stone', 'glass', 'velvet',
		'gentle', 'fierce', 'weary', 'eager', 'somber', 'bright',
		'morning', 'evening', 'twilight', 'midnight', 'dawn', 'dusk',
		'winter', 'spring', 'summer', 'autumn', 'harvest', 'solstice',
		'wanderer', 'scholar', 'merchant', 'guardian', 'messenger', 'hunter',
		'footsteps', 'whispers', 'lanterns', 'tapestry', 'cobblestone',
		'carriage', 'chapter', 'parchment', 'threshold', 'wilderness',
		'eloquent', 'mysterious', 'resolute', 'tranquil', 'luminous',
		'beckoned', 'emerged', 'lingered', 'wandered', 'glimmered',
	];

	function mulberry32(seed: number): () => number {
		return () => {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function pick<T>(rng: () => number, arr: readonly T[]): T {
		return arr[Math.floor(rng() * arr.length)];
	}

	function seededPick(idx: number, arr: readonly string[]): string {
		const rng = mulberry32(idx * 2654435761);
		return pick(rng, arr);
	}

	function pickRange(rng: () => number, min: number, max: number): number {
		return min + Math.floor(rng() * (max - min + 1));
	}

	function makeSentence(rng: () => number, wordCount: number): string {
		const words: string[] = [];
		for (let i = 0; i < wordCount; i++) {
			words.push(pick(rng, WORDS));
		}
		// Capitalize first word
		words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
		return words.join(' ') + '.';
	}

	function makeChapterTitle(idx: number): string {
		const chapters = [
			'The Beginning', 'The Journey', 'Discovery', 'The Encounter',
			'Shadows Fall', 'The Crossing', 'The Letter', 'Secrets Revealed',
			'The Threshold', 'Lost and Found', 'The Gathering', 'Beyond the Horizon',
			'The Silent Watcher', 'Whispers in the Dark', 'The Golden Hour',
			'Echoes of Yesterday', 'The Far Shore', 'The Hollow Promise',
			'Beneath the Surface', 'The Last Candle', 'The Wanderer\'s Return',
			'Before the Storm', 'The Ancient Path', 'A Quiet Evening',
			'The Market at Dawn', 'Letters Never Sent', 'The Broken Compass',
			'Through the Gates', 'The Forest Deep', 'At the Crossroads',
		];
		return chapters[idx % chapters.length];
	}

	function pageText(idx: number): { title: string; paragraphs: string[]; pageNum: number } {
		const chapterIdx = Math.floor(idx / 4);
		const subIdx = idx % 4;
		const rng = mulberry32(idx * 7919 + 1);

		if (subIdx === 0) {
			// Chapter start: short intro paragraph
			const p1Words = pickRange(rng, 20, 35);
			const p2Words = pickRange(rng, 18, 30);
			return {
				title: makeChapterTitle(chapterIdx),
				paragraphs: [
					makeSentence(rng, p1Words),
					makeSentence(rng, p2Words),
				],
				pageNum: idx + 1,
			};
		} else if (subIdx === 3) {
			// End of chapter: closing paragraph, sometimes a quote
			const p1Words = pickRange(rng, 22, 40);
			const p2Words = pickRange(rng, 15, 25);
			return {
				title: '',
				paragraphs: [
					makeSentence(rng, p1Words),
					makeSentence(rng, p2Words),
				],
				pageNum: idx + 1,
			};
		} else {
			// Continuation: 2-3 paragraphs
			const count = pickRange(rng, 2, 3);
			const paragraphs: string[] = [];
			for (let i = 0; i < count; i++) {
				const pWords = pickRange(rng, 20, 42);
				paragraphs.push(makeSentence(rng, pWords));
			}
			return {
				title: '',
				paragraphs,
				pageNum: idx + 1,
			};
		}
	}
</script>

<svelte:head>
	<title>Book Demo — 200 Pages</title>
</svelte:head>

<div class="demo">
	<header class="top-bar">
		<div class="left-group">
			<a href="/" class="back-link">← Home</a>
			<span class="page-indicator">Page {currentPage + 1} of {TOTAL_PAGES}</span>
		</div>
		<span class="nav-hint">← Swipe to flip →</span>
		<button class="mode-toggle" onclick={() => (touchOnly = !touchOnly)}>
			{touchOnly ? '🖐️ Touch only' : '🖱️ Any input'}
		</button>
	</header>
	<div class="swipe-area">
		<Swipe totalPages={TOTAL_PAGES} bind:currentPage showIndicator={false} globalGestures={true} {touchOnly}>
			{#snippet pageContent(idx: number)}
				{@const content = pageText(idx)}
				<article class="book-page">
					<div class="page-body">
						{#if content.title}
							<h2 class="chapter-title">{content.title}</h2>
							<div class="chapter-ornament">✦</div>
						{/if}
						{#each content.paragraphs as para}
							<p class="paragraph">{para}</p>
						{/each}
					</div>
					<div class="page-footer">
						<span class="page-number">{content.pageNum}</span>
					</div>
				</article>
			{/snippet}
		</Swipe>
	</div>

</div>

<style>
	.demo {
		height: 100dvh;
		width: 100%;
		display: flex;
		flex-direction: column;
		background: #2c1810;
		font-family: 'Georgia', 'Times New Roman', serif;
	}

	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 24px;
		background: #1a0f0a;
		color: #8b7355;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.left-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.back-link {
		padding: 2px 10px;
		border-radius: 10px;
		border: 1px solid #8b7355;
		background: transparent;
		color: #8b7355;
		font-size: 0.75rem;
		font-family: 'Georgia', 'Times New Roman', serif;
		text-decoration: none;
		text-transform: none;
		letter-spacing: 0.05em;
		opacity: 0.75;
		transition: opacity 0.2s, background 0.2s;
	}

	.back-link:hover {
		opacity: 1;
		background: rgba(139, 115, 85, 0.12);
	}

	.nav-hint {
		opacity: 0.6;
	}

	.mode-toggle {
		padding: 4px 12px;
		border-radius: 12px;
		border: 1px solid #8b7355;
		background: transparent;
		color: #8b7355;
		font-size: 0.75rem;
		font-family: 'Georgia', 'Times New Roman', serif;
		cursor: pointer;
		text-transform: none;
		letter-spacing: 0.05em;
		transition: background 0.2s;
	}

	.mode-toggle:hover {
		background: rgba(139, 115, 85, 0.15);
	}

	.book-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #f5f0e8 0%, #e8dfd3 100%);
		color: #3a2a1a;
		padding: 48px 40px 32px;
		box-sizing: border-box;
		position: relative;
		overflow-y: auto;
		/* Book spine shadow on the leading edge */
		box-shadow:
			inset 4px 0 8px rgba(0,0,0,0.06),
			inset -1px 0 2px rgba(0,0,0,0.04);
	}

	.swipe-area {
		flex: 1;
		min-height: 0;
	}

	.page-body {
		flex: 1;
	}

	.chapter-title {
		font-size: 1.35rem;
		font-weight: 700;
		color: #2c1810;
		margin: 0 0 4px;
		letter-spacing: 0.02em;
		line-height: 1.3;
	}

	.chapter-ornament {
		text-align: center;
		font-size: 0.8rem;
		color: #8b7355;
		margin: 8px 0 16px;
		opacity: 0.7;
	}

	.paragraph {
		font-size: 0.95rem;
		line-height: 1.7;
		margin: 0 0 1em;
		text-align: justify;
		hyphens: auto;
		text-indent: 1.5em;
	}

	.paragraph:first-of-type {
		text-indent: 0;
	}

	.paragraph:first-of-type::first-letter {
		font-size: 2.4em;
		font-weight: 700;
		float: left;
		line-height: 0.9;
		margin-right: 6px;
		margin-top: 2px;
		color: #5c3d2e;
	}

	.page-footer {
		text-align: center;
		padding-top: 16px;
		flex-shrink: 0;
	}

	.page-number {
		font-size: 0.8rem;
		color: #8b7355;
		font-style: italic;
	}
</style>
