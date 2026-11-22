<script lang="ts">
	import ReportPage from '$lib/components/listas/ReportPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Reporte</title>
</svelte:head>

<ReportPage data={data} />
