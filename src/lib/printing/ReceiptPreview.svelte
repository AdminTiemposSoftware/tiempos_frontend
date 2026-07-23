<script lang="ts">
    import { onMount } from 'svelte';
    import QRCode from 'qrcode';
    import type { Receipt } from './types';

    let { groupedItems, receipt, details, qrData, onReady = undefined } = $props<{
        groupedItems: boolean;
        receipt: Receipt;
        details?: string;
        qrData: string;
        onReady?: () => void;
    }>();
    let QrCode = $state<any>(null);
    let qrImage = $state<string>('');
    
    export async function generateQrImage(
        data: string,
        size = 200,
        errorCorrection: 'L' | 'M' | 'Q' | 'H' = 'M'
    ): Promise<string> {
        return await QRCode.toDataURL(data, {
            width: size,
            margin: 0,
            errorCorrectionLevel: errorCorrection,
            type: 'image/png'
        });
    }

    
    onMount(async () => {
        const module = await import('@castlenine/svelte-qrcode');
        QrCode = module.default;
        qrImage = await generateQrImage(
            qrData,
            180,
            'L'
        );

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
            <span class="numbers">{item.numbers.join(' x ')}</span>
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
        <QrCode data={qrData} size={160} errorCorrection="L" />
        <!-- <img src={qrImage} alt="QR Code" width="120" height="120" /> -->
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
    gap: 6px;
}

/* .amount,
.numbers {
    white-space: nowrap;
} */

.space {
    display: block;
    height: 5mm;
}

.numbers {
    text-align: right;
    width: fit-content;
}

.amount {
    text-align: left;
}

.separator {
    flex: 1;
    min-width: 25mm;
    border-bottom: 1px dashed currentColor;
    transform: translateY(2px);
}
</style>