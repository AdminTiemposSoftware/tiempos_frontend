<script lang="ts">
	import { onMount } from 'svelte';
    import { page } from '$app/state';
    import ReceiptPreview from '../../../lib/printing/ReceiptPreview.svelte';


    let printed = $state(false);
    const data = $derived.by(() => {
		const encoded = page.url.searchParams.get('data');

		if (!encoded) return null;

		try {
			return JSON.parse(decodeURIComponent(encoded));
		} catch {
			return null;
		}
	});

    function handleReady() {
        if (printed) return;

        printed = true;
        requestAnimationFrame(() => {
            window.print();
            window.onafterprint = () => window.close();
        });
    }
</script>

<ReceiptPreview 
    receipt={data?.receipt}
    groupedItems={true} 
    qrData={data?.qrData}
    details={data?.details}
    onReady={handleReady}
/>

<style>
    @page {
	size: 40mm auto;
	margin: 0;
    }

    html,
    body {
        margin: 0;
        padding: 0;
        width: 80mm;
    }

    @media screen {
        body {
            background: #eee;
            display: flex;
            justify-content: center;
            padding: 1rem;
        }
    }
</style>