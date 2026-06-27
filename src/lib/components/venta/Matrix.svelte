<script lang="ts">
    let {
        rows = $bindable(10),
        columns = $bindable(10),
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        report = $bindable<reportItem[]>([])
    } = $props();

	type reportItem = {
		branch_id: number;
		branch_name: string;
		draw_schedule_id: number;
		draw_schedule_name: string;
		draw_id: number;
		draw_name: string;
		number: number;
		amount: number;
		is_reventado: boolean;
		is_megareventado: boolean;
	};

    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';

    let groupedNumbers = $state<Record<number, reportItem[]>>({});

    $effect(() => {
        groupedNumbers = groupReportByNumber(report);
    });

    function groupReportByNumber(reportItems: reportItem[]): Record<number, reportItem[]> {
        return reportItems.reduce<Record<number, reportItem[]>>((acc, item) => {
            (acc[item.number] ??= []).push(item);
            return acc;
    }, {});
    }
    
</script>

<section class="matrix-container">
    {#key animateKey}
        <div class="matrix-wrapper">
            {#if isLoading}
                <div class="matrix-spinner" aria-label="Loading" role="status">
                    <div class="spinner"></div>
                </div>
            {/if}
            <div class="matrix" style="--cols: {columns}">
                {#each Array.from({ length: rows }) as _, rowIndex}           
                    {#each Array.from({ length: columns }) as _, colIndex}
                        {@const index = colIndex * rows + rowIndex}

                        <div 
                            class={`matrix-cell 
                                ${$prohibitedNumbers.some((n) => n.number === index) ? "prohibited-number" : ""} 
                                ${groupedNumbers[index]?.length > 0 ? "has-report" : ""
                            }`}
                        >
                            <input
                                type="number"
                                value={index}
                                disabled={true}
                                class={``}
                            />
                            <input
                                type="number"
                                class="price price-animated"
                                class:price-loading={isLoading}
                                style={`--delay: ${index * 4}ms;`}
                                value={groupedNumbers[index]?.reduce((sum, item) => sum + item.amount, 0) || $sellingMatrix[index] || 0}
                                disabled={true}
                            />
                        </div>
                    {/each}
                {/each}
            </div>
        </div>
    {/key}
</section>

<style>
    .matrix-container {
        flex:1.5 ;
    }

    .matrix {
        display: grid;
        grid-template-columns: repeat(var(--cols), auto);
        width: fit-content;
        align-items: center;
    }

    .matrix-wrapper {
        position: relative;
        width: fit-content;
    }

    .matrix-spinner {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.6);
        z-index: 1;
    }

    .spinner {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid #cbd5e1;
        border-top-color: #2563eb;
        animation: spin 0.7s linear infinite;
    }

    .matrix-cell {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .prohibited-number input[type="number"] {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
    }
    .prohibited-number input[type="number"]:first-child {
        background-color: #f8c3c7;
        border-color: #f5c6cb;
    }
    .has-report input[type="number"]:first-child {
        width: 32px;
        padding: 0.1rem !important;
        font-size: 0.95rem;
    }

    .price {
        width: 100% !important; 
        background-color: #ffffff;
    }

    .price-animated {
        animation: price-pop 200ms ease-out;
        animation-delay: var(--delay, 0ms);
    }

    .price-loading {
        opacity: 0;
        color: transparent;
    }

    @keyframes price-pop {
        0% {
            transform: scale(0.98);
            background-color: #e6f0ff;
            opacity: 0;
            color: transparent;
        }
        60% {
            color: transparent;
        }
        100% {
            transform: scale(1);
            background-color: #ffffff;
            opacity: 1;
            color: inherit;
        }
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .matrix-cell input[type="number"]{
        width: 40px;
        height: 35px;
        padding: 0.5rem;
        text-align: center;
        border: 1px solid #ccc;
        font-size: 1.1rem;
    }


    .matrix-cell input[type="number"]:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
</style>
