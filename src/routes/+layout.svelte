<script lang="ts">
	import Sidebar from '../lib/components/Sidebar.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div class="app"><Sidebar /><main>{@render children()}</main></div>

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
</style>
