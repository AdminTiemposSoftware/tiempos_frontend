<script lang="ts">
    import TooltipGroupNode from './TooltipGroupNode.svelte';
    import {
        buildGroupingTree,
        groupReportByNumber,
        type GroupingMode,
        type ReportItem
    } from './grouping';

    let {
        mode = $bindable<'20x5' | '5x20' | '10x10'>('10x10'),
        rows = $bindable(10),
        columns = $bindable(10),
        animateKey = $bindable<string | number | null>(null),
        isLoading = $bindable<boolean>(false),
        report = $bindable<ReportItem[]>([]),
        groupingModes = $bindable<GroupingMode[]>([]),
        groupingMode = $bindable<GroupingMode | null>(null)
    } = $props();

    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';

    let groupedNumbers = $state<Record<number, ReportItem[]>>({});
    let hoveredIndex = $state<number | null>(null);
    const activeGroupingModes = $derived(
        ((groupingModes.length > 0 ? groupingModes : groupingMode ? [groupingMode] : ['branch']) as GroupingMode[])
    );

    let hoveredReportItems = $derived(hoveredIndex === null ? [] : (groupedNumbers[hoveredIndex] ?? []));

    let hoveredGroupingTree = $derived(
        hoveredReportItems.length === 0 ? [] : buildGroupingTree(hoveredReportItems, activeGroupingModes)
    );

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
        groupedNumbers = groupReportByNumber(report);
    });

    function showTooltip(index: number) {
        hoveredIndex = index;
    }

    function clearTooltip() {
        hoveredIndex = null;
    }

    function getAmount(index: number) {
        return groupedNumbers[index]?.reduce((sum, item) => sum + item.amount, 0) || $sellingMatrix[index] || 0;
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
                            role="group"
                            onmouseenter={() => showTooltip(index)}
                            onmouseleave={clearTooltip}
                        >
                            {#if hoveredIndex === index && hoveredGroupingTree.length > 0}
                                <div class="report-tooltip" role="tooltip">
                                    <ul class="tooltip-groups">
                                        {#each hoveredGroupingTree as node}
                                            <TooltipGroupNode node={node} />
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
                                value={getAmount(index)}
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
        position: relative;
    }

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

    .matrix-cell input[type="number"]:first-child {
        color: var(--color-text);
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
    .has-report:hover {
        transform: scale(1.05);
        transition: transform 0.2s ease-in-out;
    }

    .has-report input[type="number"]:first-child {
        width: 32px;
        padding: 0.1rem !important;
        font-size: 0.95rem;
    }

    .price {
        width: 100% !important;
        background-color: #ffffff;
        color: var(--color-text);
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
