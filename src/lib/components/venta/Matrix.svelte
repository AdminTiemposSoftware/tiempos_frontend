<script lang="ts">
    import { formatAmount, type ReportItem } from './grouping';

    let {
        mode = $bindable<'20x5' | '5x20' | '10x10'>('10x10'),
        rows = $bindable(10),
        columns = $bindable(10),
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        report = $bindable<ReportItem[]>([]),
        numberTotals = {},
        breakdown = {},
        useSellingMatrixFallback = true,
        winnerNumbers = [],
        reportProhibitedNumbers = []
    } = $props();

    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';

    let groupedNumbers = $state<Record<number, ReportItem[]>>({});
    let hoveredIndex = $state<number | null>(null);
    type BreakdownRow = { draw: string; draw_schedule: string; branch: string; total: number };
    const numberTotalsByNumber = $derived(numberTotals as Record<number, number>);
    const breakdownByNumber = $derived(breakdown as Record<number, BreakdownRow[]>);
    const prohibitedNumberSet = $derived(
        new Set($prohibitedNumbers.map((item) => item.number))
    );
    const reportProhibitedNumberSet = $derived(new Set(reportProhibitedNumbers));
    const winnerNumberSet = $derived(new Set(winnerNumbers));
    const amountsByNumber = $derived(numberTotalsByNumber);
    let hoveredBreakdown = $derived(hoveredIndex === null ? [] : (breakdownByNumber[hoveredIndex] ?? []));

    $effect(() => {
        if (mode === '20x5') {
            rows = 20;
            columns = 5;
        } else if (mode === '5x20') {
            rows = 5;
            columns = 20;
        } else {
            rows = 10;
            columns = 10;
        }
    });

    $effect(() => {
        groupedNumbers = Object.fromEntries(
            Object.keys(numberTotalsByNumber).map((number) => [Number(number), [{} as ReportItem]])
        );
    });

    function showTooltip(index: number) {
        hoveredIndex = index;
    }

    function clearTooltip() {
        hoveredIndex = null;
    }

    function getAmount(index: number) {
        const reportAmount = amountsByNumber[index];
        if (reportAmount !== undefined) {
            return reportAmount;
        }

        return useSellingMatrixFallback ? ($sellingMatrix[index] || 0) : 0;
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
                                ${prohibitedNumberSet.has(index) ? "prohibited-number" : ""}
                                ${reportProhibitedNumberSet.has(index) ? "report-prohibited-number" : ""}
                                ${winnerNumberSet.has(index) ? "winner-number" : ""}
                                ${groupedNumbers[index]?.length > 0 ? "has-report" : ""
                            }`}
                            role="group"
                            onmouseenter={() => showTooltip(index)}
                            onmouseleave={clearTooltip}
                        >
                            {#if hoveredIndex === index && hoveredBreakdown.length > 0}
                                <div class="report-tooltip" role="tooltip">
                                    <ul class="tooltip-groups">
                                        {#each hoveredBreakdown as item}
                                            <li class="tooltip-node">
                                                <div class="group-header">
                                                    <span class="group-label">{item.draw}</span>
                                                    <span class="group-subtotal">{formatAmount(item.total)}</span>
                                                </div>
                                                <div>{item.draw_schedule} - {item.branch}</div>
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
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
                                value={Math.round(getAmount(index))}
                                disabled={true}
                            />
                            <div
                                class="report-info"
                                hidden
                            >
                                <span>{groupedNumbers[index]?.length || 0}</span>
                            </div>
                        </div>
                    {/each}
                {/each}
                {#each Array.from({ length: columns }) as _, colIndex}
                    <div
                        class="matrix-cell"
                        style={`grid-column: ${colIndex + 1}; grid-row: ${rows + 1};`}
                    >
                        <input
                            type="number"
                            class="price price-animated"
                            value={Array.from({ length: rows }, (_, rowIndex) => getAmount(colIndex * rows + rowIndex))
                                .reduce((sum, amount) => sum + amount, 0)}
                            disabled={true}
                        />
                    </div>
                {/each}
            </div>
        </div>
    {/key}
</section>

<style>
    .report-tooltip {
        position: absolute;
        bottom: calc(100% + 0.5rem);
        left: 50%;
        transform: translateX(-50%);
        min-width: 12rem;
        max-width: 14rem;
        padding: 0.55rem 0.7rem;
        border-radius: 0.5rem;
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
        z-index: 3;
        pointer-events: none;
        font-size: 0.8rem;
        line-height: 1.3;
    }

    .report-tooltip::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0.4rem;
        border-style: solid;
        border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
    }

    .tooltip-title {
        display: block;
        font-weight: 600;
        margin-bottom: 0.35rem;
    }

    .report-tooltip ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

	.tooltip-groups {
		gap: 0.45rem;
	}

    .prohibited-number input[type="number"],
    .report-prohibited-number input[type="number"] {
        background-color: #f8d7da !important;
        border-color: #f5c6cb !important;
        color: #721c24 !important;
    }

    .prohibited-number input[type="number"]:first-child,
    .report-prohibited-number input[type="number"]:first-child {
        background-color: #f8c3c7 !important;
        border-color: #f5c6cb !important;
    }

    .winner-number input[type="number"] {
        background-color: #d1e7dd !important;
        border-color: #badbcc !important;
        color: #0f5132  !important;
    }

    .winner-number input[type="number"]:first-child {
        background-color: #b9dfc9 !important;
        border-color: #badbcc !important;
    }

    .report-prohibited-number.winner-number input[type="number"]:first-child {
        background-color: #b9dfc9 !important;
        border-color: #badbcc !important;
        color: #0f5132 !important;
    }

    .report-prohibited-number.winner-number input[type="number"]:not(:first-child) {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
    }

    .has-report:hover {
        transform: scale(1.05);
        transition: transform 0.2s ease-in-out;
    }

    .has-report input[type="number"]:first-child {
        width: 32px;
        padding: 0.1rem !important;
        font-size: 0.95rem;
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
</style>
