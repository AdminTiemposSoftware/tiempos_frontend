<script lang="ts">
	import Sidebar from '../lib/components/Sidebar.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { setAuth } from '$lib/stores/auth';
	import {Notifications} from '@tadashi/svelte-notification';
	import './layout.css';
	import './banca-responsive.css';

	let { children } = $props();

	let isResponsiveBancaRoute = $derived(['/banca/inicio', '/banca/ganadores'].includes(page.url.pathname.replace(/\/$/, '')));

	let isLoginRoute = $derived(page.url.pathname.startsWith('/puesto/login') || page.url.pathname.startsWith('/banca/login'));

	$effect(() => {
		if (browser) {
			setAuth(page.data?.user ?? null);
		}
	});
</script>

<div class:banca-responsive={isResponsiveBancaRoute} class={`app ${isLoginRoute ? 'auth-only' : ''}`}>
    <Notifications />
	{#if !isLoginRoute}
		<Sidebar responsive={isResponsiveBancaRoute} />
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
		padding: 1rem;
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
