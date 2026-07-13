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
    <p>{receipt.serial}</p>
    <p>{receipt.title}</p>
    {#if receipt.subtitles}
        {#each receipt.subtitles as subtitle}
            <p>{subtitle}</p>
        {/each}
    {/if}
    <hr>
    {#each lines as item}
        <div class="line">
            <span>{item.numbers.join(' x ')}</span>
            <span>₡{item.amount}</span>
        </div>
    {/each}
    <hr>
    <div class="line total">

        <span>Total</span>
        <span>₡{receipt.total}</span>
    </div>
    {#if details}
        <p>Detalles</p>
        <p>{details}</p>
    {/if}

    {#if QrCode}
        <QrCode data={qrData} size={100} errorCorrection="L" />
        <!-- <img src={qrImage} alt="QR Code" width="120" height="120" /> -->
    {/if}
    {#if receipt.footer}
        {#each receipt.footer as footerItem}
            <p>{footerItem}</p>
        {/each}
    {/if}
</div>

<style>
.receipt {
    width: 80mm;
    background: white;
    color: black;
    font-family: monospace;
    padding: 15px 8px;
    border: 1px solid #ccc;
    text-align: center;
}

.line {
    display: flex;
    justify-content: space-between;
}
</style>