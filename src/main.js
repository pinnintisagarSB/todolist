import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'SB'
	}
});

export default app;