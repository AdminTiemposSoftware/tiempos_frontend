<script lang="ts">
    import { auth } from '../../../lib/stores/auth';
	import Report from '../../../lib/components/listas/Report.svelte';

	let { data } = $props();
</script>

<svelte:head>
    <title>Inicio</title>
</svelte:head>

<Report user={$auth.user?.role} data={data} ignoredGroupingModes={['branch']} />
