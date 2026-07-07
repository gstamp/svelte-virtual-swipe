/// <reference types="vitest" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte()],
	resolve: {
		conditions: ['browser', 'import', 'module', 'default']
	},
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'happy-dom'
	}
});
