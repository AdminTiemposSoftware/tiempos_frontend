<script lang="ts">
	import { onMount } from 'svelte';
    import { page } from '$app/state';
    import ReceiptPreview from '../../../lib/printing/ReceiptPreview.svelte';
	import type { Receipt } from '../../../lib/printing/types';


    let printed = $state(false);
    let data = $state<{
        receipt?: Receipt;
        qrData?: string;
        details?: string;
        printMode?: 'normal' | 'reprint';
    } | null>(null);

    onMount(() => {
        const key = page.url.searchParams.get('key');
        const encoded = page.url.searchParams.get('data');

        if (key) {
            try {
                const stored = localStorage.getItem(key);
                localStorage.removeItem(key);
                data = stored ? JSON.parse(stored) : null;
            } catch {
                data = null;
            }
            return;
        }

        if (encoded) {
            try {
                data = JSON.parse(decodeURIComponent(encoded));
            } catch {
                data = null;
            }
        }
    });

    const receiptWithMode = $derived.by(() => {
        if (!data?.receipt) return undefined;

        return {
            ...data.receipt,
            footerLines: [
                ...(data?.printMode === 'reprint' ? ['REIMPRESO'] : []),
                ...(Array.isArray(data.receipt.footerLines) ? data.receipt.footerLines : [])
            ]
        };
    });

    function handleReady() {
        if (printed) return;

        printed = true;
        requestAnimationFrame(() => {
            window.onafterprint = () => window.close();
            window.print();
        });
    }
</script>

{#if receiptWithMode}
    <ReceiptPreview
        receipt={receiptWithMode}
        groupedItems={true}
        qrData={data?.qrData ?? ''}
        details={data?.details}
        onReady={handleReady}
    />
{:else}
    <p class="print-error">No se pudo preparar el tiquete para imprimir.</p>
{/if}

<style>
    @page {
        size: 80mm auto;
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
