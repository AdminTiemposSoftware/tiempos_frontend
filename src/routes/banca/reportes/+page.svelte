<script lang="ts">
	import ReportPage from '$lib/components/listas/ReportPage.svelte';

	let { data } = $props();

	const branchOptions = $derived(
		(Array.isArray(data?.branchNames) ? data.branchNames : [])
			.map((item: { id?: number; name?: string }) => ({
				value: Number(item.id),
				label: String(item.name ?? '')
			}))
			.filter((item) => Number.isFinite(item.value))
	);
</script>

<svelte:head>
	<title>Reporte</title>
</svelte:head>

<ReportPage
	data={data}
	apiPath="/banca/report"
	showBranchFilter={true}
	{branchOptions}
/>