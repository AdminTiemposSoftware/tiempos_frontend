<script lang="ts">
	import Sidebar from '../lib/components/Sidebar.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { setAuth } from '$lib/stores/auth';
	import './layout.css';

	let { children } = $props();

	let isLoginRoute = $derived(page.url.pathname.startsWith('/login'));

	$effect(() => {
		if (browser) {
			setAuth(page.data?.user ?? null);
		}
	});
</script>

<div class={`app ${isLoginRoute ? 'auth-only' : ''}`}>
	{#if !isLoginRoute}
		<Sidebar />
	{/if}

	<main>{@render children()}</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: row;
		min-height: 100vh;
	}

	main {
		display: flex;
		padding: 2rem;
		width: 100%;
		font-size: 1.1rem;
		box-sizing: border-box;
	}

	.app.auth-only {
		justify-content: center;
	}

	.app.auth-only main {
		padding: 0;
		justify-content: center;
		align-items: center;
	}
</style>