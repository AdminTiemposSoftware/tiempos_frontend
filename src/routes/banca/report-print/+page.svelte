<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import ReportModal from '$lib/components/listas/ReportModal.svelte';
	import type { GroupingMode } from '$lib/components/venta/grouping';

	let printed = false;
	let data = $state<{
		report?: unknown[];
		winners?: unknown[];
		prohibitedNumbers?: unknown[];
		groupingModes?: GroupingMode[];
		printHeader?: {
			branches: string[];
			drawSchedules: string[];
			dateFrom: string;
			dateTo: string;
		};
	} | null>(null);

	onMount(() => {
		const key = page.url.searchParams.get('key');
		if (!key) return;

		const printOrigin = window.location.origin;

		function handlePrintData(event: MessageEvent) {
			if (
				event.origin !== printOrigin ||
				event.source !== window.opener ||
				event.data?.type !== 'report-print-data' ||
				event.data?.key !== key
			) {
				return;
			}

			try {
				data = JSON.parse(event.data.data);
			} catch {
				data = null;
			}
			window.removeEventListener('message', handlePrintData);
		}

		window.addEventListener('message', handlePrintData);
		window.opener?.postMessage({ type: 'report-print-ready', key }, printOrigin);

		return () => window.removeEventListener('message', handlePrintData);
	});

	$effect(() => {
		if (printed || !data) return;

		printed = true;
		void printReport();
	});

	async function printReport() {
		await tick();
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		window.onafterprint = () => window.close();
		requestAnimationFrame(() => {
			window.print();
		});
	}
</script>

<svelte:head>
	<title>Reporte</title>
</svelte:head>

{#if data}
	<ReportModal
		report={Array.isArray(data.report) ? data.report : []}
		winners={Array.isArray(data.winners) ? data.winners : []}
		prohibitedNumbers={Array.isArray(data.prohibitedNumbers) ? data.prohibitedNumbers : []}
		initialGroupingModes={Array.isArray(data.groupingModes) ? data.groupingModes as GroupingMode[] : undefined}
		printHeader={data.printHeader}
		printable={true}
		showModal={true}
	/>
{/if}

<style>
	@page {
		size: A4 portrait;
		margin: 6mm;
	}

	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		background: white;
	}

	:global(body) {
		color: black;
	}

	@media screen {
		:global(body) {
			padding: 1rem;
			background: #eee;
		}
	}

	@media print {
		:global(body *) {
			visibility: visible !important;
		}

		:global(body) {
			background: white !important;
		}

		:global(.app) {
			display: block !important;
			min-height: 0 !important;
		}

		:global(.app > :first-child:not(main)) {
			display: none !important;
		}

		:global(main) {
			display: block !important;
			padding: 0 !important;
		}
	}
 </style>
