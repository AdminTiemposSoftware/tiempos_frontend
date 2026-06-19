<script lang="ts">
    export let rows: number = 10;
    export let columns: number = 10;
    export let data: number[][] = [];
    export let animateKey: string | number | null = null;
    export let isLoading: boolean = false;

    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';

    if (data.length > 0) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                const index = j * rows + i;
                sellingMatrix.update(prev => ({ ...prev, [index]: data[i][j] }));
            }
        }
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
                            class={`matrix-cell ${$prohibitedNumbers.some((n) => n.number === index) ? "prohibited-number" : ""}`}
                        >
                            <input
                                type="number"
                                value={index}
                                disabled={true}
                            />
                            <input
                                type="number"
                                class="price price-animated"
                                class:price-loading={isLoading}
                                style={`--delay: ${index * 4}ms;`}
                                value={$sellingMatrix[index] || 0}
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
