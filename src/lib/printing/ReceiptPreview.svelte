<script lang="ts">
    import { onMount } from 'svelte';
    import type { Receipt } from './types';

    let { groupedItems, receipt, details, qrData = $bindable(), onReady = undefined } = $props<{
        groupedItems: boolean;
        receipt: Receipt;
        details?: string;
        qrData: string;
        onReady?: () => void;
    }>();
    let QrCode = $state<any>(null);

    onMount(async () => {
        const module = await import('@castlenine/svelte-qrcode');
        QrCode = module.default;

        onReady?.();
    });

    const lines = $derived.by(() => {
        const sourceItems = groupedItems?.length ? groupedItems : receipt.items;
        const groups = new Map<string, { numbers: string[]; amount: string | number }>();

        for (const item of sourceItems) {
            const key = String(item.amount);
            const current = groups.get(key);

            if (current) {
                current.numbers.push(String(item.number));
                continue;
            }

            groups.set(key, {
                numbers: [String(item.number)],
                amount: item.amount,
            });
        }

        return Array.from(groups.values());
    });

    function chunk<T>(items: T[], size: number): T[][] {
        const result: T[][] = [];

        for (let i = 0; i < items.length; i += size) {
            result.push(items.slice(i, i + size));
        }

        return result;
    }

    onMount
</script>
<div class="receipt">
{#if receipt.ticket_number}
<div class="line">
    <p>{receipt.serial}</p>
    <span class="separator" aria-hidden="true"></span>
    <p>{receipt.ticket_number}</p>
</div>
{:else}
    <p>{receipt.serial}</p>
{/if}
    <p>{receipt.title}</p>
    {#if receipt.subtitles}
        {#each receipt.subtitles as subtitle}
            <p>{subtitle}</p>
        {/each}
    {/if}
    <span class="space"> </span>

    <div class="line">
        <span>Monto</span>
        <span>Numero</span>
    </div>
    <hr>
    {#each lines as item}
        <div class="line">
            <span class="amount">₡{item.amount}</span>
            <span class="separator" aria-hidden="true"></span>

            <span class="numbers">
                {#each chunk(item.numbers, 4) as numbers, i}
                    {#if i > 0}<br />{/if}
                    {numbers.join(' x ')}
                {/each}
            </span>
        </div>
    {/each}
    <hr>
    <div class="line total">

        <span>₡{receipt.total}</span>
        <span>Total</span>
    </div>
    {#if details}
        <p>Detalles</p>
        <p>{details}</p>
    {/if}

    {#if QrCode}
    <div class="qr-code">
        <QrCode data={qrData} size={100} errorCorrection="L" />
    </div>
    {/if}
    {#if receipt.footer}
        {#each receipt.footer as footerItem}
            <p>{footerItem}</p>
        {/each}
    {/if}
    <span class="space"> </span>
</div>

<style>
.receipt {
    width: 80mm;
    background: white;
    color: black;
    font-family: monospace;
    padding: 15px 8px;
    text-align: center;
    box-sizing: border-box;
    height: auto;
    max-height: none;
    overflow: visible;
}

.qr-code {
    margin: 0 auto;
    display: flex;
    justify-content: center;
    padding: 3mm 0;
}

.line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
}

.space {
    display: block;
    height: 5mm;
}

.numbers {
    text-align: left;
    width: auto;
    min-width: 0;
    flex: 0 1 auto;
    white-space: normal;
    overflow-wrap: break-word;
}

.amount {
    text-align: left;
}

.separator {
    flex: 1;
    min-width: 5mm;
    border-bottom: 1px dashed currentColor;
    transform: translateY(2px);
}
</style>
