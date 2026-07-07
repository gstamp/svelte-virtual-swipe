const IGNORED_WARNINGS = new Set([
	'a11y_no_noninteractive_tabindex',
	'a11y_no_noninteractive_element_interactions',
	'a11y_no_static_element_interactions',
]);

/** @type {import('svelte/compiler').CompileOptions} */
const config = {
	compilerOptions: {
		runes: true
	},
	onwarn(warning, handler) {
		if (IGNORED_WARNINGS.has(warning.code)) return;
		handler?.(warning);
	}
};

export default config;
