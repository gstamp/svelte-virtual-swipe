import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const isTest = process.env.VITEST === 'true';

export default defineConfig({
	plugins: isTest
		? [svelte()]
		: [
				sveltekit({
					compilerOptions: {
						runes: ({ filename }) =>
							filename.split(/[/\\]/).includes('node_modules') ? undefined : true
					},
					adapter: adapter()
				})
			],
	resolve: isTest
		? { conditions: ['browser', 'import', 'module', 'default'] }
		: undefined,
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'happy-dom'
	}
} as import('vite').UserConfig & {
	test?: { include: string[]; environment: string }
});
