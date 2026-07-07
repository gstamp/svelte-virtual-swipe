<script lang="ts">
</script>

<svelte:head>
	<title>Swipe PoC</title>
</svelte:head>

<div class="nav-hub">
	<h1>Swipe Component PoC</h1>
	<p class="subtitle">Touch-driven horizontal page flip in Svelte 5</p>
	<div class="cards">
		<a href="/basic" class="card">
			<h2>Basic Demo</h2>
			<p>Four colored pages with swipe navigation. Touch-only — use device emulation on desktop.</p>
		</a>
		<a href="/interactive" class="card">
			<h2>Interactive Demo</h2>
			<p>Interactive elements inside swipe pages — verifies click/swipe separation works.</p>
		</a>
		<a href="/global" class="card">
			<h2>Global Gestures</h2>
			<p>Swipe from anywhere on the page — the gesture surface extends beyond the component.</p>
		</a>
		<a href="/book" class="card">
			<h2>Book Demo</h2>
			<p>200 pages of procedurally generated book content — tests performance and rendering at scale.</p>
		</a>
	</div>
</div>

<style>
	.nav-hub {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		color: #e0e0e0;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem;
		color: #fff;
	}

	.subtitle {
		font-size: 1.1rem;
		opacity: 0.7;
		margin: 0 0 3rem;
	}

	.cards {
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		padding: 2rem;
		width: 300px;
		text-decoration: none;
		color: inherit;
		transition: background 0.2s, transform 0.2s;
	}

	.card:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-4px);
	}

	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.35rem;
		color: #fff;
	}

	.card p {
		margin: 0;
		font-size: 0.95rem;
		opacity: 0.75;
		line-height: 1.5;
	}
</style>
